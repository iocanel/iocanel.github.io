+++
title = "Jenkins setups for Kubernetes and Docker Workflow"
author = ["Ioannis Canellos"]
date = 2018-02-28T22:24:00+02:00
draft = false
+++

## Intro {#intro}

During the summer I had the chance to play a little bit with [Jenkins](https://jenkins.io) inside [Kubernetes](https://kubernetes.io). More specifically I wanted to see what’s the best way to get the [Docker Workflow Plugin](https://github.com/jenkinsci/docker-workflow-plugin) running.
So, the idea was to have a Pod running [Jenkins](https://jenkins.io) and use it to run builds that are defined using [Docker Workflow Plugin](https://github.com/jenkinsci/docker-workflow-plugin).  After a lot of reading and a lot more experimenting I found out that there are many ways of doing this, with different pros and different cons each.
This post goes through all the available options. More specifically:

-   Builds running directly on Master
-   Using the [Docker Plugin](https://github.com/jenkinsci/docker-plugin) to start Slaves
-   Using the [Docker Plugin](https://github.com/jenkinsci/docker-plugin) and Docker in Docker
-   Using [Swarm](https://github.com/jenkinsci/swarm-plugin) clients
-   [Swarm](https://github.com/jenkinsci/swarm-plugin) with Docker in Docker

Before I go through all the possible setups, I think that it might be helpful to describe what are all these plugins.


### [Docker Plugin](https://github.com/jenkinsci/docker-plugin) {#docker-plugin}

A [Jenkins](https://jenkins.io) plugin that is using Docker in order to create and use slaves. It uses http in order to communicate with Docker and create new containers. These containers only need to be java ready and also run SSHD, so that the master can ssh into them and do its magic. There are a lot of images for slave containers over the internet, the most popular at the time of my reattach was the evarga jenkins slave.
The plugin is usable but feels a little bit flaky, as it creates the Docker container but sometimes it fails to connect to the slave and retries (it usually takes 2 to 3 attempts). Tried with many different slave images and many different authentication methods (password, key auth etc) with similar experiences.
[Swarm](https://github.com/jenkinsci/swarm-plugin)
Having a plugin to create the slave is one approach. The other is “Bring your own slaves” and this is pretty much what swarm is all about. The idea is that the [Jenkins](https://jenkins.io) master is running the [Swarm](https://github.com/jenkinsci/swarm-plugin) plugin and the users are responsible for starting the swarm clients (its just a java process).
java -jar /path/to/swarm-client.jar <http://jenkins.master:8080>
view rawgistfile1.txt hosted with  by GitHub
The client connects to the master and let’s it know that it is up and running. Then the master is able to start builds on the client.


### [Docker Workflow Plugin](https://github.com/jenkinsci/docker-workflow-plugin) {#docker-workflow-plugin}

This plugin allows you to use Docker images and containers in workflow scripts, or in other words execute workflow steps inside Docker containers &amp; create Docker from workflow scripts.
Why?

To encapsulate all the requirements of your build in a Docker image and not worry on how to install and configure them.
Here’s how an example Docker Workflow script looks like:

```groovy
node('docker') {
   docker.image('maven').inside {
      git 'https://github.com/fabric8io/example-camel-cdi'
      sh 'mvn clean install'
   }
}
```

Note: You don’t need to use the [Docker Plugin](https://github.com/jenkinsci/docker-plugin) to you the [Docker Workflow Plugin](https://github.com/jenkinsci/docker-workflow-plugin).
Also: The [Docker Workflow Plugin](https://github.com/jenkinsci/docker-workflow-plugin) is using the Docker binary. This means that you need to have the docker client installed wherever you intend to use the  [Docker Workflow Plugin](https://github.com/jenkinsci/docker-workflow-plugin).
Almost forgot: The “executor” of the build and the containers that participate in the workflow, need to share the project workspace. I won’t go into details, right now. Just keep in mind that it usually requires access to specific paths on the docker host (or some short of shared filesystem). Failure to satisfy this requirements leads to “hard to detect” issues like builds hunging forever etc.

Now we are ready to see what are the possible setups.


## No slaves {#no-slaves}

This is the simplest approach. It doesn’t involve [Jenkins](https://jenkins.io) slaves, the builds run directly on the master by configuring a fixed pool of executors.
Since there are no slaves, the container that runs [Jenkins](https://jenkins.io) itself will need to have the Docker binary installed and configured to point to the actual Docker host.

How to use the docker host inside [Kubernetes](https://kubernetes.io)?

There are two approaches:


### Using the [Kubernetes](https://kubernetes.io) API {#using-the-kubernetes-api}

By mounting /var/run/docker.sock
You can do (1) by using a simple shell script like the one below.

```shell
#!/bin/bash
KUBERNETES=https://$KUBERNETES_SERVICE_HOST:$KUBERNETES_SERVICE_PORT
TOKEN=`cat /var/run/secrets/kubernetes.io/serviceaccount/token`
POD=`hostname`
curl -s -k -H "Authorization: Bearer $TOKEN" $KUBERNETES/api/v1/namespaces/$KUBERNETES_NAMESPACE/pods/$POD | grep -i hostIp | cut -d "\"" -f 4
```

You can (2) by specifying a hostDir volume mount on [Jenkins](https://jenkins.io) POD.

```json
{
"volumeMounts": [
  {
    "name": "docker-socket",
    "mountPath": "/var/run/docker.sock",
    "readOnly": false
  }
],


"volumes": [
  {
    "name": "docker-socket",
    "hostPath": {
      "path": "/var/run/docker.sock"
    }
  }
]
}
```

An actual example of such setup can be found here.


#### Pros: {#pros}

-   Simplest possible approach
-   Minimal number of plugins


#### Cons: {#cons}

-   Doesn’t scale
-   Direct access to the Docker daemon
-   Requires access to specific paths on the host (see notes on [Docker Workflow Plugin](https://github.com/jenkinsci/docker-workflow-plugin))


## [Docker Plugin](https://github.com/jenkinsci/docker-plugin) managed Slaves {#docker-plugin-managed-slaves}

The previous approach doesn’t scale for the obvious reasons. Since, Docker and [Kubernetes](https://kubernetes.io) are already in place, it sounds like a good idea to use them as a pool of resources.
So we can add [Docker Plugin](https://github.com/jenkinsci/docker-plugin) and have it create a slave container for each build we want to run. This means that we need a Docker container that will have access to the Docker binary (docker workflow requirement) and will also mount the workspace of the project from the master.
As mentioned above the master will need to connect via ssh into the slave. For this to succeed, either credentials need to get configured or the proper ssh keys. In both cases the xml configuration of the docker plugin needs to get updated in order to refer to the id of the [Jenkins](https://jenkins.io) credentials configuration (for example see this config.xml).

So what exactly is this id?

[Jenkins](https://jenkins.io) is using the Credentials Plugin to store and retrieve credentials. Each set of credentials has a unique id and other plugins can use this id in order to refer to a set of credentials. For security reasons the passwords, passphrase etc are not stored in plain text, but instead they are encrypted using SHA256. They key that is used for encryption is also encrypted so that things are more secure. You can find more details on the subject on this great post on “Credentials storage in [Jenkins](https://jenkins.io)“.

What I want you to note, is that due to the way credentials are stored in [Jenkins](https://jenkins.io)  its not trivial to create a master and a slave image that talk to each other, without human interaction. One could try to use scripts like:

```shell
#Generate master.key and secret
MAGIC="::::MAGIC::::"
mkdir -p /var/jenkins_home/secrets
openssl rand -hex 128 > /var/jenkins_home/secrets/master.key
openssl dgst -sha256 -binary /var/jenkins_home/secrets/master.key > /tmp/master.hashed
HEX_MASTER_KEY=`head -c 16 /tmp/master.hashed | xxd -l 16 -p`
openssl rand 259 > /tmp/base
echo $MAGIC >> /tmp/base
openssl enc -aes-128-ecb -in /tmp/base -K $HEX_MASTER_KEY -out /var/jenkins_home/secrets/hudson.util.Secret
```

To generate the secret and the master key. And to use them for encrypting a password you can use a  script like:

```shell
#!/bin/bash
IN=`echo $1 | base64`
SUFFIX="::::MAGIC::::"
MASTER_KEY=`cat /var/jenkins_home/secrets/master.key`
HASHED_MASTER_KEY=`echo -n $MASTER_KEY | sha256sum | cut -d " " -f 1`
HASHED_MASTER_KEY_16=${HASHED_MASTER_KEY:0:16}
openssl enc -d -aes-128-ecb -in /var/jenkins_home/secrets/hudson.util.Secret -K $HASHED_MASTER_KEY -out /tmp/hudson.key
HUDSON_KEY=`cat /tmp/hudson.key`
HUDSON_KEY_TRIMMED=${HUDSON_KEY:0:-16}
HUDSON_KEY_16=${HUDSON_KEY_TRIMMED:0:16}
echo $HUDSON_KEY_16 > /tmp/hudson16.key
echo "$IN$SUFFIX" > /tmp/jenkins.password
openssl enc -aes-128-ecb -in /tmp/hudson16.key -out /tmp/jenkins.password.enc -K $IN
```

To actually encrypt the passwords. I wouldn’t recommend this to anyone, I am just showing the scripts to emphasise on how complex this is. Of course, scripts like that also make use of details internal to Credentials Plugin and also feels a little hacky. What I found a slightly more elegant approach to configure credentials by throwing the following groovy script inside [Jenkins](https://jenkins.io) init.groovy.d:

```groovy
import jenkins.model.*
import com.cloudbees.plugins.credentials.*
import com.cloudbees.plugins.credentials.common.*
import com.cloudbees.plugins.credentials.domains.*
import com.cloudbees.plugins.credentials.impl.*
import com.cloudbees.jenkins.plugins.sshcredentials.impl.*
import hudson.plugins.sshslaves.*;

domain = Domain.global()
store = [[https://jenkins.io][Jenkins]].instance.getExtensionList('com.cloudbees.plugins.credentials.SystemCredentialsProvider')[0].getStore()

priveteKey = new BasicSSHUserPrivateKey(
CredentialsScope.GLOBAL,
"jenkins-slave-key",
"root",
new BasicSSHUserPrivateKey.UsersPrivateKeySource(),
"",
""
)

usernameAndPassword = new UsernamePasswordCredentialsImpl(
  CredentialsScope.GLOBAL,
  "jenkins-slave-password", "Jenkis Slave with Password Configuration",
  "root",
  "jenkins"
)

store.addCredentials(domain, priveteKey)
store.addCredentials(domain, usernameAndPassword)
```

The snippet above demonstrates how to create both username/password credentials and also SSH private key with an empty passphrase.


#### Pros: {#pros}

-   Simple enough


#### Cons: {#cons}

-   [Docker Plugin](https://github.com/jenkinsci/docker-plugin) is currently not there yet?
-   Direct access to the Docker daemon
-   Requires access to specific paths on the host (see notes on [Docker Workflow Plugin](https://github.com/jenkinsci/docker-workflow-plugin))

Even if we put the issues with the [Docker Plugin](https://github.com/jenkinsci/docker-plugin) aside, I’d still like to go for an approach that wouldn’t directly talk to the Docker daemon that is running behind [Kubernetes](https://kubernetes.io).


## [Docker Plugin](https://github.com/jenkinsci/docker-plugin) managed Slaves with D.I.N.D. {#docker-plugin-managed-slaves-with-d-dot-i-dot-n-dot-d-dot}

Why would one want to use Docker in Docker?
In our case in order to avoid going behind [Kubernetes](https://kubernetes.io) back.

The number of possibilities here grows. One could use DIND directly on the :Kubernetes master, or one could combine it with the [Docker Plugin](https://github.com/jenkinsci/docker-plugin) so that each slave runs its own daemon and be 100% isolated.

Either way, what happens during the build is completely isolated from the rest of the world. On the other hand it does require the use of privileged mode. This can be an issue as the mode may not be available in some environments (i.e. it wasn’t available on Google Container Engine last time I checked).

Note: By hosting a docker daemon in the slave, frees us from the requirement of using volume mounts on the outer docker (remember, only the executor and the workflow steps need to share workspace).


#### Pros: {#pros}

-   100% Isolation
-   Doesn’t require access to specific paths on outer docker!


#### Cons: {#cons}

-   Complexity
-   Requires Privileged Mode
-   Docker images are not “cached”
-   Using [Swarm](https://github.com/jenkinsci/swarm-plugin) Clients

D.I.N.D. or not one still has to come up with a solution for scaling and [Docker Plugin](https://github.com/jenkinsci/docker-plugin) so far doesn’t seem like an ideal solution. Also the equivalent of the [Docker Plugin](https://github.com/jenkinsci/docker-plugin) for [Kubernetes](https://kubernetes.io) (the [Kubernetes Plugin](https://github.com/jenkinsci/kubernetes-plugin)) does seem that it needs a little more attention. So we are left with [Swarm](https://github.com/jenkinsci/swarm-plugin).
Using the [Swarm](https://github.com/jenkinsci/swarm-plugin) does seem like a good fit, since we are using [Kubernetes](https://kubernetes.io) and its pretty trivial to start N number of containers running the Swarm client. We could use a replication controller with the appropriate image.


#### Pros: {#pros}

-   Fast
-   Scaleable
-   Robust


#### Cons: {#cons}

-   Slaves need to get managed externally.
-   Requires access to specific paths on the host (see notes on [Docker Workflow Plugin](https://github.com/jenkinsci/docker-workflow-plugin))


## Using [Swarm](https://github.com/jenkinsci/swarm-plugin) Clients with D.I.N.D. {#using-swarm-clients-with-d-dot-i-dot-n-dot-d-dot}

The main issue with D.I.N.D. in the this use case, is the fact that the images in the “in Docker”  are not cached. One could try to experiment with sharing the Docker Registry but I am not sure if this is even possible.
On the other hand with most of the remaining options we need to use hostPath mounts, which may not work in some environments.

A solution that solves both of the issues above is to combine [Swarm](https://github.com/jenkinsci/swarm-plugin) with D.I.N.D.

With [Swarm](https://github.com/jenkinsci/swarm-plugin) the clients stay (rather than get wiped after each build). This solves the image caching issues.

Also, with D.I.N.D. we no longer need to use hostPath mounts via [Kubernetes](https://kubernetes.io).

So we have a win – win.


#### Pros: {#pros}

-   Fast
-   Scaleable
-   Robust
-   100% Isolation
-   Images are cached


#### Cons {#cons}

-   Slaves need to get managed externally.


## Closing thoughts {#closing-thoughts}

All the available setups can be found on github under [jenkins-setups-for-kubernetes-and-docker-workflow](https://github.com/iocanel/blog/tree/jenkins-setups-for-kubernetes-and-docker-workflow/sources) branch.

I tired all of the above setups as part of a poc I was doing: “[Jenkins](https://jenkins.io) for Docker Workflow on [Kubernetes](https://kubernetes.io)” and I thought that I should share. There are still things I’d like to try like:

-   Use secrets for authentication to the slaves.
-   Remove clutter

Feel free to add experiences, suggestions, correction in the comments.
I hope you found it useful.
