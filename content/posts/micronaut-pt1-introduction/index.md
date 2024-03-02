+++
title = "Micronaut: Introduction"
author = ["Ioannis Canellos"]
description = "Introduction to micronaut"
date = 2018-10-25T14:39:00+03:00
draft = false
categories = ["development"]
tags = ["java", "micronaut"]
+++

## Prologue {#prologue}

As I am approaching my 40s its becoming harder and harder to get really excited with a new framework. There are of course some exception to this rule and [micronaut](http://micronaut.io) is such an exception.
I won't get into details here, but in many ways I feel that [micronaut](http://micronaut.io) is a framework I would like to have written myself...

So, this post is going to be a first look at [micronaut](http://micronaut.io). It will include:

-   an introduction
-   my first application
-   packaging the application as a [docker](https://docker.io) image
-   packaging and running inside [openshift](https://openshift.com).


## What is micronaut? {#what-is-micronaut}

According to the official documentation [micronaut](http://micronaut.io) is a micro services framework, for building modular and testable microservice applications.
Some highlights:

-   Own DI
-   Autoconfiguration
-   Service Discovery
-   Http Routing

and more...

The framework has been created from the same team that brought us [grails](https://grails.org) and it does look like it in many ways.
When it comes to features however, it feels like a combination of [spring boot](https://spring.io/projects/spring-boot) and [spring cloud](https://cloud.spring.io) that promises to be more lightweight.


### More lightweight? {#more-lightweight}

Traditional DI approaches in Java be it [spring](https://spring.io), CDI etc, is built around reflection, proxies etc. Not so long ago there was an effort aiming mostly mobile devices that was built around the idea of handling most of the problem at compile time instead of runtime.
The project was called [dagger](https://github.com/square/dagger). I am not sure how it went in terms of adoption, but I didn't feel it ever had a strong presence in the enterprise world.

What does these have to do with micronaut?

[micronaut](http://micronaut.io) is using a similar approach with [dagger](https://github.com/square/dagger), relying more on annotation processors instead of using reflection, proxies etc.


## Getting started {#getting-started}

The first thing one needs to get started with [micronaut](http://micronaut.io) is the \`mn\` binary, which gives you access to a [grails](https://grails.org)-like cli:


### Installation {#installation}

To install the \`mn\` the documentation suggests the use of [sdkman](https://sdkman.io) (I've also blogged on [sdkman](https://sdkman.io) [here](http://iocanel.com/2018/10/a-quick-look-at-sdkman)).

```shel
sdk install micronaut
```


### Creating a hello world example {#creating-a-hello-world-example}

Once the installation is complete you can create a new [micronaut](http://micronaut.io) application using the cli:

```shell
mn create-app helloworld
```

The generated project is a [docker](https://docker.io)-ready [gradle](https://gradle.org) project that contains just a single class:

```java
package helloworld;

import io.micronaut.runtime.Micronaut;

public class Application {

    public static void main(String[] args) {
        Micronaut.run(Application.class);
    }
}
```

Note, that options are provided to select language, build tool and testing framework.

This will be very familiar to [spring boot](https://spring.io/projects/spring-boot) users.

Now, let's see how we can create a rest controller. From within the helloworld directory:

```shell
mn create-controller HelloController
```

The command will generate the controller class and also a test for the controller.

The controller out of the box will just provide a single method that returns http status \`OK\`.
That can be easily modified, to:

```java
package helloworld;

import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Get;

@Controller("/hello")
public class HelloController {

    @Get("/")
    public String index() {
        return "Hello World!";
    }
}
```

To run the application you can just use:

```shell
./gradlew run
```


#### Noteworthy {#noteworthy}

It seems that its possible to specify things like language and testing framework not only on application level but also on controller level too.
So for instance we can add a second controller in kotlin:

```shell
mn create-controller KotlinController --lang kotlin
```

The code generation part worked a treat, however I wasn't able to get the kotlin controller (inside a java project) running even when I manually added the kotlin plugin inside the \`build.gradle\` file.


### Packaging the application {#packaging-the-application}

As mentioned above the generated app is [docker](https://docker.io)-ready.
Meaning that it comes with a docker file.

```shell
docker build -t iocanel/mn-helloworld:latest .
```

The first time I tried to build the image, it failed and that was due to the fact that the docker build relies on copying the jar that's expected to be build locally.
While, I am not against this approach, when its not coordinated by an external tool (e.g. [fabric8 maven plugin](https://maven.fabric8.io)) it does feel a bit weird.

Second attempt:

```shell
./gradlew build
docker build -t iocanel/mn-helloworld:latest .
```

This time everything worked smoothly! Let's see what we got in terms of size and startup times compared to [spring boot](https://spring.io/projects/spring-boot).

|             | jar  | uberjar | docker | startup time |
|-------------|------|---------|--------|--------------|
| micronaut   | 1.4K | 12M     | 114M   | 0.892 sec    |
| spring boot | 3.4  | 16M     | 119M   | 2.232 sec    |

Please note that these measurements are simplistic, they are not meant to prove anything and are there just give a very rough idea of the overall behavior of [micronaut](http://micronaut.io).


### Packaging and running inside Openshift {#packaging-and-running-inside-openshift}

For vanilla [kubernetes](https://kubernetes.io)  the packaging process doesn't differ much. In this section I'll describe how you can package and run the application in [openshift](https://openshift.com).

The first step is to define a binary build. The binary build will use the \`source to image\` for java.
Once the build is defined, we can start it and pass the folder that contains the [micronaut](http://micronaut.io) uberjar as a parameter.

```shell
  oc new-build --binary --strategy=source --name=helloworld fabric8/s2i-java:2.3
  oc start-build helloworld --from-dir=./build/libs --follow
```

The resulting image will include the uberjar under /deployments (this is how the fabric8 s2i image works).
So all we need, is to start a new app and just tell the container which jar to use.

```shell
  oc new-app helloworld:latest -e JAVA_APP_JAR=/deployments/helloworld-0.1-all.jar
```

This will create a new [DeploymentConfig](https://docs.openshift.com/enterprise/3.0/dev_guide/deployments.html) and a service for our application. In a few seconds the application will be up and running. Let's try it out.


#### Exposing our application {#exposing-our-application}

The service that was created by the \`oc new-app\` command will NOT expose port 8080 which is what we need. That's because the \`fabric8/s2i-java\` image doesn't expose it (feel free to correct me here if I missed something).
So, we will delete the generated service and create and expose one that matches our needs.

```shell
  oc delete svc helloworld
  oc expose dc helloworld --port 8080,8787,9779
  oc expose svc helloworld
```

This will create the service exposing port 8080 and also expose the service to \`<http://helloworld-micronaut.127.0.0.1.nip.io>\`.

Now, its just a matter of using curl:

```shell
curl helloworld-micronaut.127.0.0.1.nip.io/hello
```


## Epilogue {#epilogue}

I think that this is enough for a first look.

I intend to write additional posts in order to try out things like:

-   hooking a database
-   using circuit breakers
-   tracing
-   more ...
