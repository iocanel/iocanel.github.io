+++
title = "Cloud notifications with Apache Camel and jclouds"
author = ["Ioannis Canellos"]
date = 2011-11-05T00:00:00+02:00
draft = false
categories = ["hints"]
tags = ["java", "camel", "jcoulds"]
+++

## Prologue {#prologue}

Yesterday I was having a talk with Adrian Cole and during our talk he had an unpleasant surprise. He found out that he forgot a node running on his Amazon EC2 for a couple of days and that it would cost him a several bucks.

This morning I was thinking about his problem and I was thinking of ways that would help you avoid situations like this.

My idea was to build a simple project that would notify you of your running nodes in the cloud via email at a given interval.

This post is about building such as solution with [Apache Camel](http://camel.apache.org), which help you integrate very easily with both your cloud provider and of course your email:%. The full story and the sources of this project can be found below.


## Working with recurring tasks {#working-with-recurring-tasks}

[Apache Camel](http://camel.apache.org) provides a quartz component, which will allow you schedule a task with a given interval.
It is really simple to use. In our case a one hour interval sounds great. Also we want an unlimited time of executions (repeatCount=-1) so it could be something like this.


## Using Camel to integrate to your Cloud provider {#using-camel-to-integrate-to-your-cloud-provider}

[Apache Camel](http://camel.apache.org) 2.9.0 will provide a jclouds component, which will allow you to use jclouds, to integrate with most cloud key/value engines &amp; compute services. I am going to use this component, to connect to my cloud provider (I will use my EC2 account, but it would work with most cloud providers)

My first task is to create a jclouds compute service and pass it to the camel-jclouds component.  This will allow me to use jclouds inside my camel routes.

To avoid providing my real credentials I’ve used property place holders and keep the real credentials in a properties file.

Now that the component is configured I am ready to define my route. The route will use Camel jclouds compute producer to send a request to my cloud provider and ask how many nodes are currently running.  This query can be further enhanced with other parameters such as group (get me all the running nodes of group X) or even image (get me all the running nodes of group X that use image Y).

All I have to do is add the following element to my route.

The out message will contain a set in each body with all the metada of the running nodes.


## Filtering the results {#filtering-the-results}

I don’t want to fire an email every time I ask my cloud provider about the running nodes, but only when there is actually a running node. The best way to do so is to use the Message Filter EIP pattern. I am going to use that in order to filter out all messages that have a body which contains an empty set.


## Sending the email {#sending-the-email}

This is the easiest part, since the only thing I need to specify are the sender, the target &amp; the subject of the email. I can do it simply but adding headers to the message. Finally I need to specify the smtp server and the credentials required for using it.

Now all we need to do is set the destination endpoint inside the message filer.


## Running the example {#running-the-example}

The full source of this example can be found at github. The project is called cloud notifier.
You will have to edit the property file camel.properties in order to add the credentials for your cloud provider and email account.
In order to run it all you need to do is type mvn camel:run.

If you have a couple of nodes running, the result will look like this.

{{< figure src="images/mail.png" caption="<span class=\"figure-number\">Figure 1: </span>Received notifications" >}}

The source of the project can be found here: [sources](https://github.com/iocanel/blog/blob/cloud-notifications-with-apache-camel/sources).

Enjoy!


## Conclusions {#conclusions}

The camel-jclouds component is really new, it will be part of 2.9.0 releasem however it already provides some really cool features. It also provides the ability to create/destroy or run scripts on your nodes from camel routes. Also it leverages jclouds blobstore API in order to integrate with cloud provider key value engines (e.g. Amazon S3)
Can you imagine executing commands in the cloud using your mobile phone and sms message? (Camel also supports protocols for exchanging sms).

I hope you find all these really useful.

Edit: While I was writing this simple app, to my surprise I found out a forgotten instance myself!
