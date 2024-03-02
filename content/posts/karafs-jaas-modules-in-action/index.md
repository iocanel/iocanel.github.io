+++
title = "Karaf JAAS modules in action"
author = ["Ioannis Canellos"]
date = 2010-09-25T00:00:00+03:00
draft = false
categories = ["development"]
tags = ["java", "osgi", "jaas", "security"]
+++

## Prologue {#prologue}

Karaf 2.1.0 has been just released! Among other new features, it includes a major revamp in the JAAS module support:

-   Encryption support
-   Database Login Module
-   Role Policies

This post will use all 3 features, in order to create a secured Wicket application on Karaf, using Karaf’s JAAS modules and Wicket’s auth-roles module.


## Introduction {#introduction}

The application that we are going to build is a simple wicket application. It will be deployed on Karaf and the user credentials will be stored in a mysql database. For encrypting the password we will use Karaf’s Jasypt encryption service implementation, to encrypt passwords using MD5 algorithm in hexadecimal format.


## Step 1: Creating the database {#step-1-creating-the-database}

The database that we are going to create will the simplest possible. We need a table that will hold username and password for each user. Each user may have one or more roles, so we will need a new table to hold the roles of the users.

We are going to create a user named “iocanel“, that will have the roles “manager” and “admin” and password “koala” (stored in MD5 with hex output).

Note, for cases that a schema for user credentials already exists, Karaf’s database login module offer’s customization by allowing the user to provide custom queries for password and role retrieval.


## Step 2: Creating a data source {#step-2-creating-a-data-source}

In order to create a data source we will use the blueprint to create a DataSource as an OSGi service.
Before we do that we will need to install the mysql bundle and its prerequisite.
They can be easily installed from karaf shell.

```sh
osgi:install wrap:mvn:javax.xml.stream/stax-api/1.0
osgi:install wrap:mvn:mysql/mysql-connector-java/5.1.13
```

Once all prerequisites are meet the datasource can be created by dropping the following xml under karaf deploy folder or by adding it under OSGI-INF/blueprint folder of our bundle.


## Step 3: Creating a JAAS realm {#step-3-creating-a-jaas-realm}

In the same manner the new JAAS realm can be created by dropping the blueprint xml under the deploy folder or by adding it under OSGI-INF/blueprint folder of our bundle.

The new realm will make use of Karaf’s JDBCLoginModule, and will also use MD5 encryption with hexadecimal output. Finally, it will be passed a role policy, that will add the “ROLE_” prefix on all role principals. This way our application can identify the role principals, without depending to the Karaf implementation.

If this isn’t that clear, note that JAAS specifies interface Principal and its implementations provide User &amp; Role principals (as implementing classes), making it impossible to distinguish between these two without having a dependency to the JAAS implementation or by having a common convention. This is what Role Policies is about.


## Step 4: Creating a wicket application {#step-4-creating-a-wicket-application}

Everything is set and all we need is to create the wicket application that will make use of our new JAAS realm in order to authenticate.

The first step is to create a Wicket Authenticated Session:

Now we need to tell our application to create such sessions and also where the location of our sign in page will be. For this purpose we will extend Wicket’s AuthenticatedWebApplication class:
Now that everything is set up, we can restrict access to the HomePage to “admins” and “managers” by making use of Wickets


## Final Words {#final-words}

I hope you found it useful. The source of this example will be added to this post soon, so stay tuned.
