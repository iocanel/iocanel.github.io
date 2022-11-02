+++
title = "Service Catalog: Connector"
author = ["Ioannis Canellos"]
description = "The service catalog connector"
date = 2018-09-13T09:50:00+03:00
draft = false
+++

## Introduction {#introduction}

This is the second post in my series about the [service catalog](https://svc-cat.io). If you haven't done already please read the first post: [service catalog: introduction](http://iocanel.com/2018/09/service-catalog-part-1/).

In this second post I'll create from scratch a [spring boot](https://spring.io/projects/spring-boot) application that exposes a JPA crud via rest.
This application will use a [service catalog](https://svc-cat.io) managed [microsoft sql server](https://www.microsoft.com/en-us/sql-server/sql-server-2017) database and I will demonstrate how you can automagically connect to it using the [service catalog connector](https://github.com/snowdrop/servicecatalog-connector).


## The spring cloud connector {#the-spring-cloud-connector}

There is a [spring cloud](https://cloud.spring.io) project called [spring cloud connectors](https://cloud.spring.io/spring-cloud-connectors). This project is all about connecting to cloud managed services. I have been working on an implementation specific to the [service catalog](https://svc-cat.io).
The idea is that you can use the [service catalog](https://svc-cat.io) to manage the services and use the [service catalog connector](https://github.com/snowdrop/servicecatalog-connector) to transparently connect to it.

At the moment it supports only relational databases, but support for additional services will be added shortly.


## Preparation {#preparation}

Most of the preparation has been already performed in the [previous post](http://iocanel.com/2018/09/service-catalog-part-1/) but I'll recap:

-   Started an [openshift](https://openshift.com) cluster.
-   Installed the [service catalog](https://svc-cat.io).
-   Provisioned a [microsoft sql server](https://www.microsoft.com/en-us/sql-server/sql-server-2017) database instance (ironically) called \`mymssql\`.

So what's left?

We need to also configure permissions...


### Allowing our app to talk to the service catalog {#allowing-our-app-to-talk-to-the-service-catalog}

Out of the box (if we logged in as admins) we can list brokers, service classes, instances and bindings using \`svcat\`. Unfortunately, this is not the case for our application.
The default service account is not expected to have permissions, so we need to grant them:

```shell
oc adm policy add-cluster-role-to-user system:openshift:service-catalog:aggregate-to-view system:serviceaccount:myproject:default
oc adm policy add-cluster-role-to-user system:aggregate-to-admin system:serviceaccount:myproject:default
```

The command above granted service catalog view permissions to the default service account of my project (which is literally called \`myproject\` and its the default project created for us).

Now, we are ready to move to the actual application.


## The actual code {#the-actual-code}

I'll use the [spring boot](https://spring.io/projects/spring-boot) cli to generate a jpa rest application:

```shell
spring init -d=data-jpa,data-rest,sqlserver demo.zip
```

To easily deploy the project into kubernetes/openshift add the fabric8 maven plugin to your pom.xml:

```xml
    <plugin>
       <groupId>io.fabric8</groupId>
       <artifactId>fabric8-maven-plugin</artifactId>
       <version>3.5.40</version>
     </plugin>
```

Now, lets create an entity. How about a \`Person\`?
Our person will be a simple JPA annotated POJO, with just:

-   id
-   first name
-   last name

... and it could look like:

```java
  import javax.persistence.Entity;
  import javax.persistence.Id;
  import javax.persistence.GeneratedValue;
  import javax.persistence.GenerationType;


  @Entity
  public class Person {
      @Id
      @GeneratedValue(strategy = GenerationType.AUTO)
      private Long id;
      private String firstName;
      private String lastName;

      public Long getId() {
        return this.id;
      }

      public void setId(Long id) {
        this.id=id;
      }

      public String getFirstName() {
             return firstName;
      }

      public void setFirstname(String firstName) {
        this.firstName=firstName;
      }

      public String getLastName() {
             return lastName;
      }

      public void setLastname(String lastName) {
        this.lastName=lastName;
      }
```

To easily perform CRUD operations for our Person we need a repository.
Here's one that uses [PagingAndSortingRepository](https://docs.spring.io/spring-data/commons/docs/current/api/org/springframework/data/repository/PagingAndSortingRepository.html) from [spring data](https://projects.spring.io/spring-data/).

```java
  import org.springframework.data.repository.PagingAndSortingRepository;
  import org.springframework.data.repository.query.Param;
  import org.springframework.data.rest.core.annotation.RepositoryRestResource;

  import java.util.List;


  @RepositoryRestResource(collectionResourceRel = "people", path = "people")
  public interface PersonRepository extends PagingAndSortingRepository {

      List findByLastName(@Param("name") String name);
  }
```

JPA-wise the last thing we need is to include some [microsoft sql server](https://www.microsoft.com/en-us/sql-server/sql-server-2017) specifc configuration in our application.properties:

```nil
spring.jpa.hibernate.ddl-auto=create-drop
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.SQLServerDialect
spring.jpa.database-platform=org.hibernate.dialect.SQLServerDialect
spring.jpa.properties.hibernate.temp.use_jdbc_metadata_defaults = false
```

And now we are done! Wait, how do we make the application talk to our sql server?


## Adding the service catalog connector {#adding-the-service-catalog-connector}

We just need to add the connector to the class path:

```xml
          <dependency>
            <groupId>me.snowdrop</groupId>
            <artifactId>servicecatalog-connector</artifactId>
            <version>0.0.2</version>
          </dependency>
```

And also create a simple bean for our DataSource:

```java
import org.springframework.cloud.config.java.AbstractCloudConfig;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

@Configuration
public class CloudConfig extends AbstractCloudConfig {

    @Bean
    public DataSource dataSource() {
       return this.connectionFactory().service("mymssql", DataSource.class);
    }
}
```

This bean does all the dirty work for us. It detects the service instance, gets the binding of the instance and from there reads the secret that contains all connection details. Last but not least it used those details to create the Datasource that the application needs.

Magic !!!


## Deploying the application {#deploying-the-application}

This is easily accomplished with f-m-p:

```shell
mvn clean package fabric8:resources fabric8:package fabric8:deploy
```


## Testing the integration {#testing-the-integration}

Now, we should be able to create a person using \`curl\`:

```shell
curl -i -X POST -H "Content-Type:application/json" -d "{  \"firstName\" : \"John\",  \"lastName\" : \"Doe\" }" `oc get endpoints | grep demo | awk -F " " '{print $2}'`/people
```

The command above gets the endpoint of our demo application and uses that in order to perform a curl. I used direct access to the endpoint as it something that works with \`oc cluster up\` without requiring much additional configuration. If you have a simpler approach feel free to provide some feedback.

Note: that the command is referring to \`demo\` as this was the mame of choice when generating the application. If you used something else you'll need to align.


## Epilogue {#epilogue}

I hope you found that useful. Feel free to give a glimpse at: <https://spring.io/guides/gs/accessing-data-rest> which was used as a reference in this post.

Enjoy!
