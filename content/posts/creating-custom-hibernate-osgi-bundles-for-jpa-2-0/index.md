+++
title = "Creating custom Hibernate OSGI bundles for JPA 2.0"
author = ["Ioannis Canellos"]
date = 2010-07-10T00:00:00+03:00
draft = false
+++

****EDIT****: I am more than happy that this post is now completely obsolete. Hibernate is now OSGi ready, Yay!


## Prologue {#prologue}

I was trying to migrate an application that uses JPA 2.0 / Hibernate to OSGi. I found out that hibernate does not provide OSGi bundles. There are some Hibernate bundles provided in the Spring Enterprise Bundle repository, however they are none available for Hibernate 3.5.x which implements JPA 2.0. So I decided to create them myself and share the experience with you.

This post describes how to OSGi-fy Hibernate 3.5.2-Final with EhCache and JTA transaction support. The bundles that were created were tested on Felix Karaf, but they will probably work in other containers too.


## Introduction {#introduction}

A typical JPA 2.0 application with Hibernate as persistence provider will probably require among other the following dependencies

-   hibernate-core
-   hibernate-annotations
-   hibernate-entitymanager
-   hibernate-validator
-   ehcache

Unfortunately, at the time this post was written none of the above was available as OSGi bundle. To make OSGi bundles for the above one needs to overcome the following problems

-   Cyclic dependencies inside Hibernate artifacts.
-   3rd party dependencies (e.g. Weblogic/Websphere Transaction Manager).
-   Common api / impl issues for validation api and hibernate cache.

The last bullet which may not be that clear points to a problem where an api loads classes from the implementation using Class.forName() or similar approaches. In the OSGi world that means that the api must import packages from the implementation.


## Hibernate cyclic dependencies {#hibernate-cyclic-dependencies}

The creation of an OSGi bundle for each hibernate artifact is possible. However, when the bundles get deployed to an OSGi container, they will fail to resolve due to cyclic package imports.

The easiest way to overcome this issue is to merge hibernate core artifacts into one bundle. Below I am going to provide an example of how to use maven bundle plug-in to merge hibernate-core, hibernate-annotations &amp; hibernate-entitymanager into one bundle.

A common way to use the maven-bundle-plugin to merge jars into artifacts is to instruct it to embed the dependencies of a project into a bundle. However, this is not very handy in cases where you need to add custom code into the final bundle. In that case you can use the maven dependency plug-in to unpack the dependencies, bundle plug-in to create the manifest and jar plug-in to instruct it to use the generated manifest in the package phase.


## Hibernate and 3rd party dependencies {#hibernate-and-3rd-party-dependencies}

Hibernate has a lot of 3rd party dependencies. Some of them are available as OSGi bundles, some need to be created and some can be excluded.

Examples of 3rd party dependencies that are available as OSGi bundle in the Spring Enterprise Repository are:

-   antlr
-   dom4j
-   cglib

Dependencies that are not available are:

-   jacc (javax.security.jacc)
    Dependencies that can be excluded vary depending on the needs. In my case I could exclude Weblogic/Websphere transaction manager, since I didn’t intend to use them. To exclude a dependency just add the packages that are to be excluded in the import packages section using the ! operator (e.g. !com.ibm.,)


## Hibernate validator and validation API {#hibernate-validator-and-validation-api}

As mentioned above the validation api provides a factory that build the validator by loading the implementing class using Class.forName(). This issue can be solved with 2 ways

-   Use dynamic imports in the API bundle to import the Implementation at runtime.
-   Make the implementation OSGi Fragment that will get attached to the API.

In this example the validation api is the one provided by the Spring Enterprise Bundle Repository, so the second approach was easier to apply.

More details on this issue can be found at this excellent blog post:
Having “fun” with [JSR-303 Beans Validation and OSGi + Spring DM](http://katastrophos.net/magnus/blog/2009/07/18/having-fun-with-jsr-303-beans-validation-and-osgi-spring-dm/)


## Hibernate and EhCache {#hibernate-and-ehcache}

More or less the same applies to EhCache. Hibernate provides an interface which is implemented by EhCache. Hibernate loads that implementation in runtime. We will do exactly the same thing  we did for hibernate validator. We will convert ehcache jar to fragement bundle so that it gets attached to the merged hibernate bundle.


## Hibernate and JTA Transactions {#hibernate-and-jta-transactions}

I kept for last the most interesting part. This part describes what needs to be added inside the bundle so that it can support JTA transactions.

For JTA transactions Hibernate needs a reference to the transaction manager. That reference is returned by the TransactionManagerLookup class specified in the persistence.xml. In a typical JEE container the lookup class just performs a JNDI to get the TransactionManager. In an OSGi container the transaction manager is very likely to be exported as an OSGi service.

This section describes how to build an OSGi based TransactionManagerLookup class. The solution presented is very simple and uses only the OSGi core framework (no blueprint implementation required).

We will add to the hibernate bundle 3 new classes:

-   TransactionManagerLocator (Service Locator).
-   OsgiTransactionManagerLookup (Lookup implementation).
-   Activator (Hibernate Bundle Activator).

****TransactionManagerLocator**** is a ServiceLocator that uses OSGi’s ServiceTracker to get a reference to the TransactionManager service.

```java
package org.hibernate.transaction;

import javax.transaction.TransactionManager;
import org.osgi.framework.BundleContext;
import org.osgi.util.tracker.ServiceTracker;

public class TransactionManagerLocator {

    private final String lookupFilter = "(objectClass=javax.transaction.TransactionManager)";
    private static BundleContext context;
    private static TransactionManagerLocator instance;
    private ServiceTracker serviceTracker;

    //Constructor
    private TransactionManagerLocator() throws Exception {
        if (context == null) {
            throw new Exception("Bundle Context is null");
        } else {
            serviceTracker = new ServiceTracker(context, context.createFilter(lookupFilter), null);
        }
    }

    public static synchronized TransactionManagerLocator getInstance() throws Exception {
        if (instance == null) {
            instance = new TransactionManagerLocator();
        }
        return instance;
    }


    public static void setContext(BundleContext context) {
        TransactionManagerLocator.context = context;
    }

    public TransactionManager getTransactionManager() {
        return (TransactionManager) serviceTracker.getService();

    }
}
```

  ****OsgiTransactionManagerLookup**** is an implementation of Hibernates TransactionManagerLookup that delegates the look
up to the TransactionManagerLocator.

```java
package org.hibernate.transaction;

import java.util.Properties;
import javax.transaction.Transaction;
import javax.transaction.TransactionManager;
import org.hibernate.HibernateException;

public class OsgiTransactionManagerLookup implements TransactionManagerLookup {

    public TransactionManager getTransactionManager(Properties props) throws HibernateException {
        try {
            return TransactionManagerLocator.getInstance().getTransactionManager();        } catch (Exception ex) {
            throw new HibernateException("Failed to lookup transaction manager.", ex);
        }
    }

    public String getUserTransactionName() {

        return "java:comp/UserTransaction";
    }

    public Object getTransactionIdentifier(Transaction transaction) {
        return transaction;
    }
}
```

****Activator**** is just a bundle activator. Its role is to pass a static reference of the bundle context to the TransactionManagerLocator (the bundle context is required by the service tracker).

```java
package org.hibernate;

import org.hibernate.transaction.TransactionManagerLocator;
import org.osgi.framework.BundleActivator;
import org.osgi.framework.BundleContext;

public class Activator implements BundleActivator {

    public void start(BundleContext bc) throws Exception {
        TransactionManagerLocator.setContext(bc);
    }

    public void stop(BundleContext bc) throws Exception {
    }
}
```


## Example use of the bundle and bundle source code {#example-use-of-the-bundle-and-bundle-source-code}

An example web application that uses the custom hibernate bundles can be found in this [post](http://iocanel.blogspot.com/2010/07/wicket-spring-3-jpa2-hibernate-osgi.html).

If you feel tired of reading and just want to use the bundles. You can download them from [here](http://sites.google.com/site/iocanel/wicket-spring-jpa2-hibernate-karaf.tar.gz). All the custom bundles are included in the maven project under the bundles folder (as seen in the picture).

{{< figure src="./bundle.jpg" >}}

The example application uses Wicket and can be easily deploy in Karaf.
Final Thoughts
I hope you found it useful.

Any feedback is more than welcome.
