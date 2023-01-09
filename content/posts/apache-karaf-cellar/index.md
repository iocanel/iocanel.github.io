+++
title = "Apache Karaf Cellar"
author = ["Ioannis Canellos"]
date = 2011-05-07T00:00:00+03:00
draft = false
+++

## Prologue {#prologue}

In some previous blog [post](http://iocanel.com/2011/03/karaf-clustering-using-hazelcast.html), I designed and implemented Cellar (a small clustering engine for Apache Karaf powered by Hazelcast). Since then Cellar grew in features and eventually was accepted inside Karaf as a subproject.

This post will provide a brief description of Cellar as it is today.


## Cellar Overview {#cellar-overview}

Cellar is designed so that it can provide Karaf the following high level features

-   ****Discovery****
    -   Multicast
    -   Unicast
-   ****Cluster Group Management****
    -   Node Grouping
-   ****Distributed Configuration Admin****
    -   per Group distributed configuration data
    -   event driven distributed / local bridge
-   ****Distributed Features Service****
    -   per Group distributed features/repos info
    -   event driven distributed / local bridge
-   ****Provisioning Tools****
    -   Shell commands for cluster provisioning

The core concept behind cellar is that each node can be a part of one ore more groups, that provide the node distributed memory for keeping data (e.g. configuration, features information, other) and a topic which is used to exchange events with the rest group members.

{{< figure src="architecture.jpg" >}}

Each group comes with a configuration, which defines which events are to be broadcasted and which are not. Whenever a local change occurs to a node, the node will read the setup information of all the groups that it belongs to and broadcast the event to the groups that whitelist the specific event.
The broadcast operation is happening via the distributed topic provided by the group. For the groups that the broadcast is supported, the distributed configuration data will be updated so that nodes that join in the future can pickup the change.


## Supported Events {#supported-events}

There are 3 types of events:

-   Configuration change event
-   Features repository  added/removed event.
-   Features installed/unistalled event.

For each of the event types above a group may be configured to enabled synchronization, and to provide a whitelist / blacklist of specific event ids.

<span class="underline">Example</span>:
The default group is configured allow synchronization of configuration. This means that whenever a change occurs via the config admin to a specific PID, the change will pass to the distributed memory of the default group and will also be broadcasted to all other default group members using the topic.
This is happening for all PIDs but org.apache.karaf.cellar.node which is marked as blacklisted and will never be written or read from the distributed memory, nor will broadcasted via the topic.
Should the user decide, he can add/remove any PID he wishes to the whitelist/blacklist.


## Syncing vs Provisioning {#syncing-vs-provisioning}

Syncing (changing stuff to one node and broadcast the event to all other nodes of the group) is one way of managing the cellar cluster, but its not the only way.
Cellar also provides a lot of provisioning capabilities. It provides tools (mostly via command line), which allow the user to build a detailed profile (configuration and features) for each group.


## Cellar in Action {#cellar-in-action}

To see how all of the things described so far in action, you can have a look at the following 5 minute cellar demo: {{< youtube HfNrTp371LA >}} 

<span class="underline">Note</span>: The video was shoot before Cellar adoption by Karaf, so the feature url, configuration PIDs are out of date, but the core functionality is fine.

I hope you enjoy it!
