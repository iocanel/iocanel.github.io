+++
title = "Service Catalog: Introduction"
author = ["Ioannis Canellos"]
description = "An introduction to the service catalog"
date = 2018-09-12T12:22:00+03:00
draft = false
categories = ["devops"]
tags = ["kubernetes", "svcat"]
+++

## Overview {#overview}

This is the first of a series of posts around the [service catalog](https://svc-cat.io). The end goal is to demonstrate how the [service catalog](https://svc-cat.io)
 can simplify building apps on [kubernetes](https://kubernetes.io) and [openshift](https://openshift.com).

The first part will cover:

-   why
-   how to install
-   how to use

The target environment will be [openshift](https://openshift.com) 3.10 on Linux using \`oc cluster up\` for development purposes.


## Introduction {#introduction}

Working with [kubernetes](https://kubernetes.io) since its early days, there are countless of times where I had to go into creating manifests for the services my application is using.
By services I am referring to things like databases, messaging systems, or any other pieces of third party software my application might need.

Each time, the process is the same:

-   Find a suitable docker image.
-   Search for matching manifests.
-   Try out.
-   Rinse and repeat.

And even when all things are in place I have to find a way of letting my application know \`how to connect\` to the service.
And of course, this only applies to services that are running \`side by side\` with the application.

What about external services?

The [service catalog](https://svc-cat.io) is a solution that brings service brokers as defined by the [open service broker api](https://www.openservicebrokerapi.org) to [kubernetes](https://kubernetes.io).

It provides a couple of new kind of resources that define:

-   service broker
-   service types
-   service instances
-   service bindings

If you want to familiarize yourself with the purpose of those, please check the qm


## Preparation {#preparation}

To manipulate the [service catalog](https://svc-cat.io) resources from the command line you will need the [service catalog](https://svc-cat.io) client.


### The service catalog client {#the-service-catalog-client}

You will need to \`svcat\` binary to interact with the catalog from the command line.

On my linux machine this can be done:

```shell
     curl -sLO https://download.svcat.sh/cli/latest/linux/amd64/svcat
     chmod +x ./svcat
     mv ./svcat /usr/local/bin/
     svcat version --client
```

Full instructions (for all operating systems) can be found in the [service catalog installation guide](https://svc-cat.io/docs/install/#installing-the-service-catalog-cli).


### Preparing the environment {#preparing-the-environment}


#### Installing the service catalog {#installing-the-service-catalog}

I will be using for [openshift](https://openshift.com) 3.10 which I'll start directly using:

```shell
      oc cluster up
      oc login -u system:admin
```

Then I just need to add the service catalog and a broker:

```shell
      oc cluster add service-catalog
      oc cluster add automation-service-broker
```


#### Validating the setup {#validating-the-setup}

To make sure everything is fine let's list the available brokers:

```shell
      svcat get brokers
```

The output should contain \`openshift-automation-broker\`.


#### Provision a service: {#provision-a-service}

Now, lets create the database. I'll be using [microsoft sql server](https://www.microsoft.com/en-us/sql-server/sql-server-2017). So let's see what the broker we installed has to offer:

```shell
      svcat get plans | grep mssql
```

If not obvious, this will list all the available classes and plans for ms sql server (classes refer to the service type and plan refers to the different flavors e.g. persistent).

```shell
      svcat provision --class dh-mssql-apb --plan ephemeral mymssql
```

Our database should be provisioned soon. Now all we need to do is to create a binding that our application will use to connect to the service.


#### Binding to the service {#binding-to-the-service}

```shell
      svcat bind mymssql
```

What this actually does is that it create a new \`Secret\` with all the connection information and it also creates a \`ServiceBinding\` which binds the instance we created with the secret.
Any piece of code that needs to connect to the service we created can use the secret (in whatever way its preferable).

In the next part of this series we will introduce you to a tool that allows [spring boot](https://spring.io/projects/spring-boot) applications to automagically connect to [service catalog](https://svc-cat.io) managed services.

Stay tuned !
