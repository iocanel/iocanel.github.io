+++
title = "Extending ServiceMix management features using Spring - Part 3"
author = ["Ioannis Canellos"]
date = 2010-05-15T00:00:00+03:00
draft = false
categories = ["hints"]
tags = ["java", "servicemix", "spring"]
+++

In the previous post [Extend ServiceMix Management features using Spring – Part 2](http://iocanel.com/2010/05/extend-servicemix-management-features-using-spring-part-2/) I demonstrated  how to use spring to gain control over endpoint lifecycle and configuration via jmx. You might wonder till now “what happens to those custom changes if I have to redeploy the assembly, restart servicemix or even worse restart the server?”. The short answer is that these changes are lost. The long answer is in this blog post, which explains how to persist those changes and how to make the endpoint reload them each time it starts.


## Part III : Modifying, Persisting and Loading Custom Configuration Automatically {#part-iii-modifying-persisting-and-loading-custom-configuration-automatically}

In order to persist and auto load custom configuration upon endpoint start-up all we need are the following.


### For persisting {#for-persisting}

-   A way to serialize the configuration in xml (jaxb2).
-   A way to persist the configuration (jpa/hibernate).


### For auto loading {#for-auto-loading}

-   A way to intercept endpoint start and activate methods (spring aop).
-   A way to apply that configuration to the endpoint (beanutils).

The basic idea is that for each endpoint, the custom configuration can be serialized to xml and persisted and with the use of aop interceptors reloaded to the endpoint each time it starts up.


## Step 1: Configuring persistence {#step-1-configuring-persistence}

For persisting configuration I am going to use JPA/Hibernate and MySQL.
I want to keep things as simple as possible, so I will create a table that will only contains 2 fields

-   ****ID****: the id of the endpoint which will be the primary key
-   ****CONFIGURATION****: A text field that will hold the configuration in xml format

The endpoint id can be retrieved by calling endpoint.getKey(). The configuration is the XML representation of the configuration (more details later).

The persistence unit, the entity and the data access object are things that we want to be reusable so they better be in a separate jar. I will call this management-support.

Let’s start creating the new jar by adding the entity.

Now we can create the persistence unit. Note that in this example I am adding all the database connection information inside persistence.xml leaving pooling to hibernate. It would be better if I created a datasource, but for the shake of simplicity I will not.

Now its time to create a very simple dao for the EndpointConfiguration entity.


## Step 2: Configuring configuration serialization {#step-2-configuring-configuration-serialization}

For each endpoint type that we want its configuration to be serialized and persistence I am going to create a pojo that contains all the properties that are managed. The pojo will be annotated with Jaxb annotations so that we can easily serialize it to xml. Before serialization takes place the pojo needs to be set the values of the current configuration. For this purpose I am going to use BeanUtils (spring beanutils). Now we can update our endpoint manager and add 2 methods (save &amp; load of configuration) and the ConfigurationDao that was presented above.

The new endpoint manager will expose to the jmx the saveConfiguration and loadConfiguration managed operation.


## Step 3: Configuring Endpoint lifecycle interception {#step-3-configuring-endpoint-lifecycle-interception}

In this section I will show how to intercept the lifecycle methods of the endpoint using spring-aop. Spring aop will be configured using cglib proxies. The goal is to intercept start and activate methods call the method load configuration on the endpoint manager and then proceed with the execution. So the interceptor needs to be aware of the endpoint that intercepts(determined by the pointcut definition) and the endpoint manager(will be injected to the bean that will play the role of the Aspect). So the interceptor will look like this

Note that we are intercepting both start and activate methods. This is because in some endpoints in order to refresh their configuration needs to be restarted while other need to be reactivated.


## Step 4: Putting the pieces together {#step-4-putting-the-pieces-together}

Now, its time to put all the pieces together. I am going to create a new jar the management support and add to it a generic endpoint manager(the base class for all entpoint managers), the endpoint configuration entity, the configuration dao and the persistance unit. The example project(wsdl-first) will be modified so that the HttpEndpointManager extends the generic endpoint manager and the http-su xbean.xml configures persistence and aop as explained above.

The generic EndpointManager
The POJO that represents HttpEndpoint configuration
The updated HttpEndpointManager

And finally the xbean.xml for the http service unit
The final configuration might seem a bit bloated. It can become a lot tidier by using xbean features, however this goes far beyound the scope of this post.


## Preparing the container {#preparing-the-container}

For this example to run we need to add a few jars to servicemix

-   hibernate-entitymanager
-   hibernate-annotations
-   aspectjrt
-   spring-orm
-   the dependencies of the above

You can download the complete example here which will contains all the dependencies under wsdl-first/lib/optional.


## Final words {#final-words}

I hope that you find it useful. Personally, I’ve been using it for quite some time now and I am very happy with it. Using this you can even alter the xslt of an xslt-endpoint using the jmx console without having to recompile, redeploy or restart your assmebly.
