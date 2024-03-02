+++
title = "Hazelcast on Karaf"
author = ["Ioannis Canellos"]
date = 2011-02-28T00:00:00+02:00
draft = false
categories = ["development"]
tags = ["java", "osgi", "karaf", "hazelcast"]
+++

## Prologue {#prologue}

The last months [Hazelcast](https://hazelcast.com) caught my attention. I first saw the JIRA of the [camel-hazelcast](http://camel.apache.org/hazelcast-component.html) component, then I read about it, I run some examples and eventually I fell in love with it.

If you are not already familiar with it, [Hazelcast](https://hazelcast.com) is an opensource clustering platform, which provdies a lot of features such as:

-   Auto discovery
-   Distributed Collection
-   Transactions
-   Data Partitioning

You can visit the [Hazelcast](https://hazelcast.com) Documentation for more information.
In this blog post I will show how to run hazelcast on [Apache Karaf](http://karaf.apache.org) or [Apache ServiceMix](http://servicemix.apache.org) and I will provide an example application that creates a hazelcast instance, deploys the hazelcast monitoring web application and adds a couple of shell commands on [Apache Karaf](http://karaf.apache.org).

Finally, I will create a [Hazelcast](https://hazelcast.com) Topic using blueprint and we will create a clustered echo command using that topic.

For all of the above I will provide the full source so that you can try it yourself.


## [Hazelcast](https://hazelcast.com) &amp; OSGi {#hazelcast-and-osgi}

According to the hazelcast website hazelcast is not yet OSGi ready (it is still in the TODO list). However, I found that versions 1.9.x are ready enough to get you going. In this post I will use the current trunk of hazelcast source (1.9.3-SNAPSHOT) for which I have created a couple of patches for the web-console and for some other minor issues.

[Hazelcast](https://hazelcast.com) Instance as an OSGi service
Even though that [Hazelcast](https://hazelcast.com) requires zero configuration, I found it best to create a [Hazelcast](https://hazelcast.com) instance using Spring, pass the desired configuration and finally expose the instance as an OSGi service.
In the snippet above I am using a minimal configuration which only set the credentials of the [Hazelcast](https://hazelcast.com). [Hazelcast](https://hazelcast.com) has no dependencies so the only thing required is the hazelcast bundle and the hazelcast monitoring war (if you wish to have access to the web console). From the Karaf shell you can just type:

Once the hazelcast and its monitoring are started, you can browse the hazelcast monitoring at <http://localhost:8181/hazelcast-monitor>. Which looks like the page below.

{{< figure src="images/hazelcast-console.png" caption="<span class=\"figure-number\">Figure 1: </span>[Hazelcast](https://hazelcast.com) console" >}}


## Building a distributed collection using the Blueprint {#building-a-distributed-collection-using-the-blueprint}

To create a distributed collection with hazelcast all you need is an instance and a unique String identifier that will be used to uniquely identify the collection. Since we already have created an instance and exposed it as an OSGi service the rest are pretty easy:

We will use this distributed topic to build a distributed echo command (A command that will print messages in the console of all nodes). Now we need two simple things:

A listener on that topic that will listen for messages and display them
A shell command that will put messages to the topic.
A listener could be as simple as this:
This is a simple pojo that contains a topic and acts as MessageListner on that topic. For each message added to the topic this listener displays it to the standard output. We could add this pojo to our blueprint xml

What’s left to be done is to create the command that will actually display the message that is added to the topic.


## Putting it them all together {#putting-it-them-all-together}

We can now start two karaf nodes either on the same machine or on separate machines in the same network, deploy hazelcast and its monitoring and finally deploy the instance, the topic and the commands as we did so far.

Let’s try the command:

{{< figure src="images/inter-karaf-messaging.png" caption="<span class=\"figure-number\">Figure 2: </span>Messaging between different karaf installations" >}}


## Using the full source {#using-the-full-source}

The code can be found on github at: [hazelcast-on-karaf-sources](https://github.com/iocanel/blog/tree/hazelcast-on-karaf/sources). It consist of 3 maven modules:

instance (it contains a spring dm descriptor which creates the instance).
shell (A shell module which contains a couple of hazelcast commands included the echo).
feature (A feature descriptor for easier installation of the above modules and their deps).
Once you build the project from the karaf shell you can run:

{{< figure src="images/demo.png" caption="<span class=\"figure-number\">Figure 3: </span>Installing and using the command" >}}

Enjoy!

Note: I am planning to blog more on the subject if I have the time, so stay around.
