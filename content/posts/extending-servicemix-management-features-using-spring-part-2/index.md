+++
title = "Extending ServiceMix management features using Spring - Part 2"
author = ["Ioannis Canellos"]
date = 2010-05-15T00:00:00+03:00
draft = false
+++

In the previous post [Extend ServiceMix Management features using Spring – Part 1](http://iocanel.com/2010/05/extend-servicemix-management-features-using-spring-part-1/) I demonstrated a very simple technique that allows you to expose endpoint lifecycle operations via jmx. Now I am going to take it one step further and expose the endpoint configuration via jmx.

If you haven’t done already please catch up by reading [Part 1](http://iocanel.com/2010/05/extend-servicemix-management-features-using-spring-part-1/).


## Part II: Modifying the configuration of a live endpoint {#part-ii-modifying-the-configuration-of-a-live-endpoint}

I am going to use the wsdl-first servicemix sample as modified in the previous post and expose the property locationURI of the HttpEndpoint to jmx using Spring’s @ManagedAttribute annotation.


## Step 1 {#step-1}

Open the HttpEndpointManager and delegate the getter and setter of HttpEndpoints locationURI property.


## Step 2 {#step-2}

Annotate both methods with @ManagedAttribute


## Enjoy {#enjoy}

Once the assembly gets deployed from the jmx console the locationURI property is exposed.
Note that once the new property is applied, the endpoint needs to be reactivated (call deactivate and activate from jmx as shown in the previous post).

As you can see in the picture I used jmx and changed the location uri from PersonService to NewPersonService, without editing, recompiling or redeploying the service assembly.

{{< figure src="jconsole.png" >}}

This approach is really simple and quite useful. Its biggest advantage is that even a person that has no knowledge of ServiceMix can alter the configuration. Moreover it simplifies the monitoring procedure of production environments.
The full source code of this example can be found here.

In the [Part 3](http://iocanel.com/2010/05/extend-servicemix-management-features-using-spring-part-3/) I will demonstrate how these changes in the configuration can be persisted and how we can intercept endpoints lifecycle so that we have those changes loaded each time the endpoint starts.
