+++
title = "jclouds & OSGi"
author = ["Ioannis Canellos"]
date = 2011-05-07T00:00:00+03:00
draft = false
+++

## OSGi in the clouds {#osgi-in-the-clouds}

The last couple of years OSGi and Cloud Computing are two buzz words, that you don’t see go hand in hand that often. JClouds is going to change that, since 1.0.0 release is OSGi ready and it also provide direct integration with Apache Karaf.


## jclouds in the Karaf {#jclouds-in-the-karaf}

The last couple of weeks I have been working with the jclouds team in order to improve the OSGification of jclouds and also to provide integration with Apache Karaf.
I will not go into much detail in this post, since there is a [[wiki. I will add however a small demo that shows how easy it is.
{{<youtube SIvSaGEKrkM>}}


## A cloud, a Karaf and a Camel {#a-cloud-a-karaf-and-a-camel}

The fact that JClouds is now OSGi ready opens up new horizons. Apache Camel is one of them. I have been working on a Camel Component that leverages JClouds blobstore abstraction, in order to provide blobstore consumers and producers via Apache Camel.

Hopefully, abstractions for Queues and Tables will follow…

You can find it and give it a try on my github repository.
