---
title: Extend ServiceMix Management features using Spring – Part 1
author: Ioannis Canellos
type: post
date: 2010-05-13T17:14:00+00:00
url: /2010/05/extend-servicemix-management-features-using-spring-part-1/
blogger_blog:
  - iocanel.blogspot.com
blogger_author:
  - Ioannis Canellos
blogger_permalink:
  - /2010/05/extend-servicemix-management-features.html
blogger_internal:
  - /feeds/1786615818482917324/posts/default/6140819168619875137
categories:
  - Hints
tags:
  - java
  - servicemix
  - spring
---
<span style="font-size: x-large;">Prologue</span>  
This is the first from a series of posts that demonstrate how to extend ServiceMix management using Spring&#8217;s jmx and aop features. The version of SerivceMix that is going to be used will be 3.3.3-SNAPSHOT but I&#8217;ve been using this technique since 3.3 and it will probably can be applied to 4.x.

<span style="font-size: x-large;">Problem</span>  
One of the most common problems I had with servicemix was that even the most simple changes in the configuration&nbsp;_(e.g. changing the name of the destination in a jms endpoint) &nbsp;_required editing the xbean.xml of the service unit and redeployment. Moreover this affected the rest of the service units contained in the service assemblies, which would be restarted too.

An other common problem was that I could not start, stop and restart a single service unit. That was a major problem since I often needed to be able to stop sending messages, while being able to accept messages in the bus. The only option I had was to split our service units in multiple service units _(e.g. inbound service unit and outbound service unit)_.

<span style="font-size: x-large;">Solution</span>  
This series of blog post will demonstrate how we used spring in order to:

  1. Obtain service unit lifecycle management via jmx.
  2. Expose endpoint and marshaler configuration via jmx.
  3. Perform configuration changes on live production environements.
  4. Persisting these changes to database.
  5. Loading endpoint custom configuration from database.

<div>
  <span style="font-size: x-large;">Part I: Starting and Stoping Endpoints</span>
</div>

<div>
  Although all ServiceMix endpoint have start and stop methods these methods are not expose neither to jmx nor to the web console.
</div>

<div>
</div>

<div>
  A very simple but usefull way to expose this methods to jmx is to use spring&#8217;s jmx auto exporting capabilities.
</div>

<div>
</div>

<div>
  <i><b>Example:</b></i>
</div>

<div>
  As an example I will use wsdl-first project from servicemix samples in order to expose the lifecycle methods of the http endpoint to jmx. To do so I will delegate its lifecycle methods <i>(start,stop)</i> to a spring bean that is annotated with the @ManagedResource annotation and I will modify the xbean.xml of the http service unit so that it automatically exports to jmx beans annotated as @ManagedResources.</p> 
  
  <p>
    <i><b>Step 1</b></i><br />The first step is to add spring as a provided dependency inside the http service unit.<br /><b>Step 2</b><br />Create the class that will be exported to jmx by spring. I will name the class HttpEndpointManager. This class will be annotated as @ManagedResource, will have a property of type HttpEndpoint and will delegate to HttpEndpoints the lifecycle methods<i> (activate,deactivate,start,stop)</i><b>. </b>This methods will be exposed to jmx by being annotated as @ManagedOperation.<br /><b>Step 3</b><br />Edit the xbean.xml of the http service unit and add the spring beans that will take care of automatically exporting the HttpEndpointManager to jmx.
  </p>
  
  <p>
    <b>Enjoy</b><br />You can now open the JConsole and use the HttpEndpointManager MBean to start/stop the HttpEndpoint without having to start/stop the whole service assembly.
  </p>
  
  <div style="clear: both; text-align: center;">
    <a href="https://i0.wp.com/4.bp.blogspot.com/_IAbNntktXuo/S-xkNhOP0VI/AAAAAAAAAAM/AmKdz8wnxNI/s1600/Screen+shot+2010-05-13+at+11.35.53+PM.png" style="clear: left; float: left; margin-bottom: 1em; margin-right: 1em;"><img border="0" src="https://i0.wp.com/4.bp.blogspot.com/_IAbNntktXuo/S-xkNhOP0VI/AAAAAAAAAAM/AmKdz8wnxNI/s320/Screen+shot+2010-05-13+at+11.35.53+PM.png?w=604" data-recalc-dims="1" /></a>
  </div>
  
  <p>
    <b>Notes</b><br />Managing the lifecycle of endpoints in a simple assembly like the wsdl-first servicemix sample has no added value<i>(since you can stop the service assembly)</i>. However this sample was chosen, since most servicemix users are pretty familiar with it. In more complex assemblies this trick is a savior<i>(cause you can stop a single endpoint, while having the rest of the endpoints running)</i>. Moreover, this is the base for even more usefull tricks that will be presented in the parts that follow.
  </p>
  
  <p>
    The full source code of this example can be found <a href="http://sites.google.com/site/iocanel/servicemix-management-part1.tar.gz">here</a>.
  </p>
  
  <p>
    In the <a href="http://iocanel.blogspot.com/2010/05/extend-servicemix-management-features_15.html">second part</a> of the series, I will demonstrate how you can extend this trick in order to perform configuration modification via jmx.
  </p>
</div>

<div>
</div>

<div>
</div>

<div>
</div>

<div>
</div>
