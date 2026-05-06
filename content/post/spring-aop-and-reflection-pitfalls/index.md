+++
title = "Spring AOP and Refleciton pitfalls"
author = ["Ioannis Canellos"]
date = 2010-06-05T00:00:00+03:00
draft = false
categories = ["hints"]
tags = ["spring", "aop"]
+++

## Prologue {#prologue}

This post intents to point out some pitfalls when using spring aop and reflection on the same objects. Moreover, it provides some examples of these pitfalls when combining ServiceMix &amp; Camel with Spring JPA/Hibernate.

The two most common uses of aspect oriented programming with spring are:

-   Security
-   Transation Handling

I found myself having issues when applying those 2 on beans that are accessed using reflection (not in all cases) and below I am going to dig into those issues.


## Spring AOP flavors {#spring-aop-flavors}

Spring aop can be used in many different flavors:

-   Compile time weaving
-   Load time weaving
-   Using dynamic or cglib proxies  (The main focus of this post)


## Cglib Proxies and reflection {#cglib-proxies-and-reflection}

There are many cases where a bean needs to be accessed using reflection. A common case is to use reflection in order to access a private field.
I could use the following piece of code in order to retrieve the privateProperty value of SomeBean using Reflection like this:
And this would work pretty cool. However, if the someBeanInstance is enhanced using cglib, the code above would break resulting in having a null value in privatePropertyValue.


## Spring's Transactional annotation and reflection {#spring-s-transactional-annotation-and-reflection}

The problem as described above might be pretty obvious, however here is a direct side effect of it that is not that obvious. Let’s assume the use of Spring’s transactional annotation. A possible set up could be
the bean annotated as transactional could be
If the resource is injected using traditional reflection(as described above), this would eventually result in a Null Pointer Exception, due to the fact that the resource would fail to be injected.
Moreover, the Exception would trigger a transaction rollback and the entity would not be saved.

You might wonder “why would reflection  fail?”. The answer is that the cglib proxy is actually a subclass of the proxied object that is created on run-time and thus reflection would fail to find the declared field on the proxy. In order to to make it work, the getDeclared needs to be called upon the super class (but it would break once you removed the aop).


## Workaround: Spring's ReflectionUtils to the rescue {#workaround-spring-s-reflectionutils-to-the-rescue}

 Spring provides a class that among others offers a work around for this issue. Here is an example of using Spring’s ReflectionUtils on cglib proxies.
Behind the scenes spring will attempt to find the declared field both on the target object(someBean) and all its superclasses. So if someBean is proxied, it will fail to find the declared field on the proxy, but it will succeed using its superclass (SomeBean.class).


## Real examples using Apache ServiceMix and Camel {#real-examples-using-apache-servicemix-and-camel}

I first encountered the issue the first time I attempted to add the transactional annotation on the bean of a ServiceMix’s BeanEndpoint. A simplified version of this case is here.
ServiceMix uses reflection (as described above) in order to inject the DeliveryChannel to the MessageExchangeLister and this reproduces the problem.  Unfortunately, a direct solution to this issue would require editing the BeanEndpoint itself (which is not such a bad idea). An other work around would be to use the transactional annotation using compile time weaving. Finally, if none of the above seems appealing, you can always create an other bean that will be annotated as transactional an make calls to that bean from inside the MessageExchangeLister.

****Note****: The bean endpoint itself uses Spring’s ReflectionUtils and it shouldn’t encounter this issue, however it still does, due to the fact that the property (in this case the DeliveryChannel) is set on the proxy and not the actual object.

A similar case I encountered was the use of Camel’s @RecipientList annotation combined with Spring’s @Transactional annotation. I will not get into details about it, since I think that by now its pretty obvious.


## Final thoughts {#final-thoughts}

If you get to understand the nature if this issue its not that hard to deal with it. However, I spent a great deal of time trying to identify the root cause.

In most cases you can bypass it by avoiding to proxy the reflection target itself. To do so you only pass a reference of the proxied object to the class that is access using reflection.

From what I read in the forums, it taunts a lot of people and this is why I decided to blog about it.

I hope you find it useful!
