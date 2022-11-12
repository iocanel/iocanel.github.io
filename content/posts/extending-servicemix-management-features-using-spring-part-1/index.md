+++
title = "Extending ServiceMix management features using Spring - Part 1"
author = ["Ioannis Canellos"]
date = 2010-05-15T00:00:00+03:00
draft = false
+++

## Prologue {#prologue}

This is the first from a series of posts that demonstrate how to extend ServiceMix management using Spring’s jmx and aop features. The version of SerivceMix that is going to be used will be 3.3.3-SNAPSHOT but I’ve been using this technique since 3.3 and it will probably can be applied to 4.x.


## Problem {#problem}

One of the most common problems I had with servicemix was that even the most simple changes in the configuration (e.g. changing the name of the destination in a jms endpoint)  required editing the xbean.xml of the service unit and redeployment. Moreover this affected the rest of the service units contained in the service assemblies, which would be restarted too.

An other common problem was that I could not start, stop and restart a single service unit. That was a major problem since I often needed to be able to stop sending messages, while being able to accept messages in the bus. The only option I had was to split our service units in multiple service units (e.g. inbound service unit and outbound service unit).


## Solution {#solution}

This series of blog post will demonstrate how we used spring in order to:

-   Obtain service unit lifecycle management via jmx.
-   Expose endpoint and marshaler configuration via jmx.
-   Perform configuration changes on live production environments.
-   Persisting these changes to database.
-   Loading endpoint custom configuration from database.


## Part 1: Starting and Stoping Endpoints {#part-1-starting-and-stoping-endpoints}

Although all ServiceMix endpoint have start and stop methods these methods are not expose neither to jmx nor to the web console.
A very simple but usefull way to expose this methods to jmx is to use spring’s jmx auto exporting capabilities.


### Example {#example}

As an example I will use wsdl-first project from servicemix samples in order to expose the lifecycle methods of the http endpoint to jmx. To do so I will delegate its lifecycle methods (start,stop) to a spring bean that is annotated with the @ManagedResource annotation and I will modify the xbean.xml of the http service unit so that it automatically exports to jmx beans annotated as @ManagedResources.


### Step 1 {#step-1}

The first step is to add spring as a provided dependency inside the http service unit.


### Step 2 {#step-2}

Create the class that will be exported to jmx by spring. I will name the class HttpEndpointManager. This class will be annotated as @ManagedResource, will have a property of type HttpEndpoint and will delegate to HttpEndpoints the lifecycle methods (activate,deactivate,start,stop). This methods will be exposed to jmx by being annotated as @ManagedOperation.


### Step 3 {#step-3}

Edit the xbean.xml of the http service unit and add the spring beans that will take care of automatically exporting the HttpEndpointManager to jmx.


### Enjoy {#enjoy}

You can now open the JConsole and use the HttpEndpointManager MBean to start/stop the HttpEndpoint without having to start/stop the whole service assembly.

{{< figure src="jconsole.png" >}}


### Notes {#notes}

Managing the lifecycle of endpoints in a simple assembly like the wsdl-first servicemix sample has no added value(since you can stop the service assembly). However this sample was chosen, since most servicemix users are pretty familiar with it. In more complex assemblies this trick is a savior(cause you can stop a single endpoint, while having the rest of the endpoints running). Moreover, this is the base for even more usefull tricks that will be presented in the parts that follow.

The full source code of this example can be found [here](http://sites.google.com/site/iocanel/servicemix-management-part1.tar.gz).

In the [second](http://iocanel.com/2010/05/extend-servicemix-management-features-using-spring-part-2/) part of the series, I will demonstrate how you can extend this trick in order to perform configuration modification via jmx.
