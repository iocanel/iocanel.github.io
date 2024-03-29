+++
title = "Introducing Ap4K"
author = ["Ioannis Canellos"]
description = "An introduction post for Ap4k"
date = 2019-01-07T17:39:00+02:00
draft = false
categories = ["development"]
tags = ["java", "kubernetes", "openshift", "dekorate"]
+++

## Prologue {#prologue}

[ap4k](https://github.com/ap4k/ap4k) is a collection of java annotations and processors for generating, customizing and testing [kubernetes](https://kubernetes.io) and [openshift](https://openshift.com) manifests.

The idea of using java annotations for customizing [kubernetes](https://kubernetes.io) and [openshift](https://openshift.com) manifests is not something entirely new.
In 2015 [fabric8](https://fabric8.io) provided an artifact called \`kubernetes-generator\` (not to be confused with other generators under the [fabric8](https://fabric8.io) umbrella) that allowed developers to hook into the compilation process code that customized these manifests.
The way the code was hooked into the compilation processors was via java annotations. The idea was nice but did required developers to write actual code, and thus was soon abandoned as in favor of the [fabric8-maven-plugin](https://maven.fabric8.io) which was rewritten at the same time by [Rolland Huss](https://ro14nd.de/about).

An other approach that used java annotations for similar purposes was [metaparticle](https://metaparticle.io) created by [Brendand Burns](https://twitter.com/brendandburns) few years later. I really liked some aspects of it, though I couldn't get used to the idea that a lot of things were done on \`run\` time.

What I wanted instead is something that is taking place purely on \`compile\` time. I wanted something with the power of [fabric8-maven-plugin](https://maven.fabric8.io), but without the paying the toll of having to write configuration in \`xml'.
So, you could say that I was after an annotation based configuration layer for [fabric8-maven-plugin](https://maven.fabric8.io).

Or even better ....

... not only for [fabric8-maven-plugin](https://maven.fabric8.io) but for any combination of build system and jvm language that supports annotations.

And that is the rationale behind [ap4k](https://github.com/ap4k/ap4k).


## A first glance at ap4k {#a-first-glance-at-ap4k}

To trigger the generation of [kubernetes](https://kubernetes.io) manifests during compilation, one needs to add the \`@KubernetesApplication\` annotation on top of the main class:

```java
  import io.ap4k.kubernetes.annoation.KubernetesApplication;

  @KuberentesApplication
  public class Main {
      //your code here
  }
```

Once the compilation is done the following files are expected to be generated relative to the class output directory:

1.  META-INF/ap4k/kubernetes.json
2.  META-INF/ap4k/kubernetes.yml

If you want to try it out by yourself you can check the [kubernetes example](https://github.com/ap4k/ap4k/tree/master/examples/kubernetes-example) that's included in [ap4k](https://github.com/ap4k/ap4k).

For [openshift](https://openshift.com) users, \`@OpenshiftApplication\` is available and will generate [openshift](https://openshift.com) flavored manifests (see [openshift example](https://github.com/ap4k/ap4k/tree/master/examples/openshift-example)).
Whatever applies to \`@KubernetesApplication\` also \`@OpenshiftApplication\` so the rest of this post will just mention the first.

The same functionality could be provided by any scaffolding tool, or even template engine only this time its done using annotations ....

... and here is were things get interesting.


## Customizing the generated manifests {#customizing-the-generated-manifests}

Customization to the manifests can be done using the \`@KubernetesApplication\`, for example to add a label:

```java
  import io.ap4k.kubernetes.annoation.KubernetesApplication;

  @KuberentesApplication(labels=@Label(key="foo", value="bar"))
  public class Main {
      //your code here
  }
```

Or to expose a port:

```java
  import io.ap4k.kubernetes.annoation.KubernetesApplication;
  import io.ap4k.kubernetes.annoation.Port;

  @KuberentesApplication(port=Port(name="http", containerPort=8181))
  public class Main {
      //your code here
  }
```

The addition of a port will result in having the container decorated with a \`containerPort\` and the manifest including a \`Service\` resource pointing to the defined port.

What's more interesting is that if jaxrs, spring rest etc annotations are detected in the code, then [ap4k](https://github.com/ap4k/ap4k) will perform the step above automatically(without the need to explicitly define the port).

This is demonstrated in: [spring boot on kubernetes example](https://github.com/ap4k/ap4k/tree/master/examples/spring-boot-on-kubernetes-example).


## Integration Testing {#integration-testing}

While [ap4k](https://github.com/ap4k/ap4k) was in its early development, the need of running integration tests was pressing. So for the internal needs of the project junit5 extensions were added.

The role of the extensions were to orchestrate integration tests for [kubernetes](https://kubernetes.io):

1.  perform container builds
2.  deploy generated resources
3.  wait until application is deployed
4.  run the actual tests

Users familiar with [arquillian-cube](https://github.com/arquillian/arquillian-cube) should see a resemblance here. With the exception of performing container builds the rest is a subset of [arquillian-cube](https://github.com/arquillian/arquillian-cube) functionality.

The more these extensions were used, the more apparent it became that they should not be just for internal use, but something that all [ap4k](https://github.com/ap4k/ap4k) users could use....


### A closer look that the junit5 extension for [kubernetes](https://kubernetes.io). {#a-closer-look-that-the-junit5-extension-for-kubernetes-dot}

This extension provides the \`@KubernetesIntegrationTest\` annotation. The presence of this annotation in a test class triggers the extension.

```java
  import io.ap4k.testing.annotation.KubernetesIntegrationTest;

  @KubernetesIntegrationTest
  public class ExampleIT {
      //test code goes here
  }
```

This alone is enough to at least test that the generated manifests can be successfully applied to the point were the application starts and becomes ready.
Of course, users would also want to perform integration tests on the actual application too (e.g. send http requests etc). For those cases, its possible to inject application \`Pod\` into the tests and from there the users can decide how to proceed.

Here's an example that uses the application pod to perform port forwarding:

```java
  import io.ap4k.deps.kubernetes.api.model.Pod;
  import io.ap4k.deps.kubernetes.client.KubernetesClient;
  import io.ap4k.deps.kubernetes.client.LocalPortForward;
  import io.ap4k.deps.okhttp3.OkHttpClient;
  import io.ap4k.deps.okhttp3.Request;
  import io.ap4k.deps.okhttp3.Response;
  import io.ap4k.testing.annotation.Inject;
  import io.ap4k.testing.annotation.KubernetesIntegrationTest;
  import io.ap4k.testing.annotation.Named;
  import org.junit.jupiter.api.Assertions;
  import org.junit.jupiter.api.Test;

  import java.net.URL;

  import static org.junit.jupiter.api.Assertions.assertEquals;
  import static org.junit.jupiter.api.Assertions.assertTrue;

  @KubernetesIntegrationTest
  public class SpringBootOnKubernetesIT {

    @Inject
    private KubernetesClient client;


    @Inject
    Pod pod;

    @Test
    public void shouldRespondWithHelloWorld() throws Exception {
      Assertions.assertNotNull(client);
      try (LocalPortForward p = client.pods().withName(pod.getMetadata().getName()).portForward(8080)) {
        assertTrue(p.isAlive());
        URL url = new URL("http://localhost:"+p.getLocalPort()+"/");

        OkHttpClient client = new OkHttpClient();
        Request request = new Request.Builder().get().url(url).build();
        Response response = client.newCall(request).execute();
        assertEquals(response.body().string(), "Hello world");
      }
    }
  }
```

This is also demonstrated in: [spring boot on kubernetes example](https://github.com/ap4k/ap4k/tree/master/examples/spring-boot-on-kubernetes-example).

If you are wondering how these extensions can perform container builds, the next section will answer all your questions.


## Container builds {#container-builds}

[ap4k](https://github.com/ap4k/ap4k) is not a tool meant to generate Dockerfiles and is not a tool meant to provide container build functionality.

It is however, a tool that in certain cases will integrate with 3rd party tools that do so for the shake of user experience.

The first case is when running integration tests. The second case is right after compilation (optionally when -Dap4k.build=true is passed to the compiler).


### Docker build {#docker-build}

Docker builds are enabled by adding the \`@EnableDockerBuild\` to the class. This requires the presence of the Dockerfile in the root of the module.
The build will be performed using the docker binary, which means that its the responsibility of the developer to have that configured before the actual build.


### Openshift s2i binary builds {#openshift-s2i-binary-builds}

In the same spirit \`@EnableS2iBuild\` is provided for [openshift](https://openshift.com) users. The annotation allows the selection of the builder image (though only the fabric8/s2i-java has been tested so far).
When the annotation is present the generated manifests will include a \`BuildConfig\` and the required \`ImageStream\` resources.

In this case the \`oc\` binary is required to be present and configured.


## Hooks {#hooks}

It has already been mentioned that under certain circumstances its possible to trigger post compilation actions, such as \`build\`. A similar action available is \`deploy\`.
These actions are executed as shutdown hooks and they will run when the build process is over.

To register the build hook, you can pass \`-Dap4k.build=true\` to the compiler. Similarly, to register the deploy hook you can pass \`-Dap4k.deploy=true\`.


## Other features {#other-features}

The project provides additional features like:

-   service catalog
-   istio
-   component crd

I will not go into details about these now. But I do intend to write about the [service catalog](https://svc-cat.io) integration soon.


## Closing {#closing}

This is a new project and new features are added day by day, so make sure to check often.
I'd like to close this post with a link to a demonstration video I recorded a couple of weeks ago:

[Ap4k Introdcution](https://www.youtube.com/watch?v=SJb4HL6nzOg)

Enjoy!
