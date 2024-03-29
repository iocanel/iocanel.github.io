+++
title = "Using init containers to handle Openshift’s arbitrary user ids"
author = ["Ioannis Canellos"]
date = 2017-09-29T00:00:00+03:00
draft = false
categories = ["hints"]
tags = ["openshift"]
+++

## intro {#intro}

[openshift](https://github.com/openshift/orgin) takes security seriously. Sometimes more seriously than I’d like (mostly cause I am lazy). One such example is the fact that containers run using arbitrary users. This is done as an extra measure to control damages, should a process somehow escapes its container boundaries.

But how does it affect users?


## the problem {#the-problem}

Users need to follow certain guidelines when creating container images.


#### don’t assume a user {#don-t-assume-a-user}

you don’t have a known uid
The uid of the user is not known in advnace. Also there is no way of controlling it.


#### you don’t have a prefixed username {#you-don-t-have-a-prefixed-username}

The same applies to the username (regardless of what’s in your Dockerfile). Even though the \`whoami\` command seems to always return \`default\`, I am not sure if this is something you can rely on.


#### you don’t have a home {#you-don-t-have-a-home}

Executing command that rely on the $HOME environment variable, might not work as expected.

examples where this becomes a problem:


### git {#git}

The git binary complaints when there is no entry of the user inside the /etc/passwd file. Using an arbitrary user id, means that there will be no entry there and thus the git binary will refuse to work.


### maven {#maven}

Maven picks up custom user settings by looking up for a settings.xml under ~/.m2/settings.xml?

Where does ~ point? Exactly!


## a solution {#a-solution}

All of the above stem from the fact that the user is not present in /etc/passwd. So the recommended approach is to use the nsswrapper library in order to use a custom passwd file on runtime.

Details of the approach can be found in [openshift](https://github.com/openshift/orgin)’s guidelines for creating image.

The basic idea is that you install and load the libnsswrapper.so and then using environment variables you point to a custom \`passwd\` and \`group\`. These files are generated on runtime (where u know the uid and can now generate an entry for the passwd). So the steps are:

use the uid to generate a passwd
use the NSS_WRAPPER_PASSWD to point to the generated passwd
use the NSS_WRAPPER_GROUP to point to a the generated group
Note: The \`NSS_WRAPPER_GROUP\` environment variable is required. If you don’t have a use for a custom group file, point it to the original one.


### using init containers {#using-init-containers}

The problem with the approach described in the previous section is that the nswrapper library needs to be added to each image that is affected by it. And if you are lazy like me, you are probably not going to like it.

So, here’s a possibly controversial (as in hacky) approach I come up with, so that I can limit the amount of effort I need to put into it.


#### composition vs inheritance {#composition-vs-inheritance}

Instead of creating a new version of docker image that contains the nsswrapper library for each of the affected images, I decided to try and create: \`One image to wrap them all\`.

In openshift, a pod may contain multiple containers and these containers can share file system (both regular and init containers). So, it is absolutely possible to have an init container copy a library to the shared file system, so that a regular container can pickup an use. And since all of the nsswrapper container handling is done via environment variables (which can be defined in the pod), it can be completely transparent to the target container.

So, \`the one image\` (that will be used as init container) will contain the \`libnsswrapper.so\` and a helper script that will:

copy that file to a shared file system.
generate the passwd (and optionally the group file)
copy the generated passwd to the shared filesystem
The script below, does the all of the above, with the use of a passwd template:

```shell
#!/bin/bash

export USER_ID=`id -u`
export GROUP_ID=`id -g`

cp /usr/lib64/libnss_wrapper.so ${SHARED_DIR}/libnss_wrapper.so
envsubst < /usr/local/share/passwd.template > ${SHARED_DIR}/generated.passwd
```

The template is used to render the passwd file using environment variables. In the end both the generated file and library are copied to the shared file system. The template could look like:

```nil
root:x:0:0:root:/root:/bin/bash
bin:x:1:1:bin:/bin:/sbin/nologin
daemon:x:2:2:daemon:/sbin:/sbin/nologin
adm:x:3:4:adm:/var/adm:/sbin/nologin
lp:x:4:7:lp:/var/spool/lpd:/sbin/nologin
sync:x:5:0:sync:/sbin:/bin/sync
shutdown:x:6:0:shutdown:/sbin:/sbin/shutdown
halt:x:7:0:halt:/sbin:/sbin/halt
mail:x:8:12:mail:/var/spool/mail:/sbin/nologin
operator:x:11:0:operator:/root:/sbin/nologin
games:x:12:100:games:/usr/games:/sbin/nologin
ftp:x:14:50:FTP User:/var/ftp:/sbin/nologin
nobody:x:99:99:Nobody:/:/sbin/nologin
${USER_NAME}:x:${USER_ID}:${GROUP_ID}:${USER_DESCRIPTION}:${USER_HOME}:/bin/bash
```

A working version of this concept can be found here: <https://github.com/syndesisio/nsswrapper>.

So, the only things that remains is to specify:

the shared filesystem and the environment variables
the environment variables so that the target container can make use of the resources.
defining a shared volume
To define a shared file system for all containers of a pod is as simple as defining an \`emptyDir\` volume:

```yaml
volumes:
- emptyDir: {}
  name: shared-volume
```

mounting the shared volume
Then we just need to make sure that the volume is mounted from all containers.

```yaml
volumeMounts:
- mountPath: /home/someuser
  name: shared-volume
```


#### configuring nsswrapper {#configuring-nsswrapper}

Last but not least we are providing then environment variables to the target container.

```yaml
env:
 - name: LD_PRELOAD
   value: /home/someuser/libnss_wrapper.so
 - name: NSS_DIR
   value: /home/someuser
 - name: NSS_WRAPPER_PASSWD
   value: /home/someuser/build.passwd
 - name: NSS_WRAPPER_GROUP
   value: /etc/group
 - name: NSS_USER_NAME
   value: someuser
 - name: NSS_USER_DESCRIPTION
   value: Some User
 - name: NSS_USER_HOME
   value: /home/someuser
```


## closing thoughts {#closing-thoughts}

As I mentioned this approach may be considered \`too hacky\`. It’s not a recognized / recommended pattern… at least not yet. So, use it at your own risk.

Also, sharing libraries between containers, can only work as long as containers use compatible standard C library implementations. For example using glibc based image (e.g. <https://github.com/syndesisio/nsswrapper>) will just don’t work with a musl based container (e.g. an alpine one). So, you may need to have a different image for each implementation of the C standard library.
