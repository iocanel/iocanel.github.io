+++
title = "Wicket with Spring 3 and Hibernate on Apache Karaf"
author = ["Ioannis Canellos"]
date = 2010-07-12T00:00:00+03:00
draft = false
categories = ["development"]
tags = ["java", "osgi", "karaf", "wicket", "spring"]
+++

EDIT: Hibernate is now OSGi ready so most of those stuff are now completely outdated.

The full source for this post has moved to github under my blog project on branch: [wicket-spring-3-jpa2-hibernate-osgi-application-on-apache-karaf](https://github.com/iocanel/blog/tree/wicket-spring-3-jpa2-hibernate-osgi-application-on-apache-karaf).


## Prologue {#prologue}

Recently I attempted to modify an existing crud web application for OSGi deployment. During the process I encountered a lot of issues such as

Lack of OSGi bundles.
Troubles wiring the tiers of the application together.
Issues on the OSGi container configuration.
Lack of detailed examples on the web.
 So, I decided to create such a guide &amp; provide full source for a working example (A very simple person crud application).

The first part of this guide is Creating custom Hibernate 3.5 OSGi bundles. This part provides an example project (which includes the bundles source) that describes how to use the custom hibernate bundles in order to build a wicket, spring 3, hibernate 3.5 jpa 2 and deploy it to Karaf.

Among others it describes:

How to wire database and web tier using the OSGi blueprint.
How to deploy web applications to Karaf 1.6.0.
A small wicket crud application.
Note: This demo application does not make use OSGi Enterprise Spec, since its an OSGi-fication of an existing application. The use of the spec will be a subject for future posts.

Enjoy!


## Environment Preparation {#environment-preparation}

The OSGi run-time that will be used in this post is Felix/Karaf version 1.6.0.
This section describes the required configuration for deploying web applications.

Once, karaf is downloaded and extracted, it can be started by typing

bin/karaf
from inside the karaf root folder.

Now, we are going to install karaf webconsole and war deployer that will allow us to deploy web applications to karaf.

```nil
features:install webconsole
features:install war

```

Note: In the background karaf fetches all the required bundles from maven repositories. You are going to need internet access for this. Moreover, if you are behind a proxy you will need to set up your jvm net.properties accordingly. Having the proxy configured in maven settings.xml is not enough.


## Custom Bundles {#custom-bundles}

Most of the bundles required for this project are available either in public maven repositories or inside Spring Enterprise Bundle Repository. However, hibernate 3.5.x which is one of the key dependencies for this project is not available as OSGi bundle (note: earlier version of hibernate can be found in Spring EBR). More details on OSGi-fying Hibernate 3.5.x in the previous part of the guide “Creating custom Hibernate 3.5 OSGi bundles“.


## Creating the application itself {#creating-the-application-itself}

The actual demo application will be the simplest possible wicket crud for persons (a killer application that stores/delete/updates a persons first name and last name to the database).

Database
The create schema script of such application in mysql would look like this:

```sql
CREATE TABLE person (
    ID MEDIUMINT NOT NULL AUTO_INCREMENT,
    FIRST_NAME VARCHAR(40) NOT NULL,
    LAST_NAME VARCHAR(40) NOT NULL,
    PRIMARY KEY (ID)
);
```

Database Tier
For the database tier we are going to create a simple bundle that will contain the entity, the dao interface and the dao implementation. The bundle will contain the necessary persistence descriptor for JPA 2.0 with hibernate as persistence provider. Finally it will use spring to create the data source, entity manager factory &amp; JPA transaction manager. This bundle will export the dao as a service to the OSGi Registry using Spring dynamic modules.

The Person entity for the example can look like:

```java

package net.iocanel.database.entities;

import java.io.Serializable;
import javax.persistence.Basic;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.NamedQueries;
import javax.persistence.NamedQuery;
import javax.persistence.Table;

/**
 *
 * @author iocanel
 */
@Entity
@Table(name = "Person")
@NamedQueries({
 @NamedQuery(name = "Person.findAll", query = "SELECT p FROM Person p"),
 @NamedQuery(name = "Person.findById", query = "SELECT p FROM Person p WHERE p.id = :id"),
 @NamedQuery(name = "Person.findByFirstName", query = "SELECT p FROM Person p WHERE p.firstName = :firstName"),
 @NamedQuery(name = "Person.findByLastName", query = "SELECT p FROM Person p WHERE p.lastName = :lastName")})
 public class Person implements Serializable {

 private static final long serialVersionUID = 1L;
 @Id
 @GeneratedValue(strategy = GenerationType.AUTO)
 @Basic(optional = false)
 @Column(name = "ID")
 private Integer id;
 @Column(name = "FIRST_NAME")
 private String firstName;
 @Column(name = "LAST_NAME")
 private String lastName;

 public Person() {
 }

 public Person(Integer id) {
  this.id = id;
 }

 public Integer getId() {
  return id;
 }

 public void setId(Integer id) {
  this.id = id;
 }

 public String getFirstName() {
  return firstName;
 }

 public void setFirstName(String firstName) {
  this.firstName = firstName;
 }

 public String getLastName() {
  return lastName;
 }

 public void setLastName(String lastName) {
  this.lastName = lastName;
 }

 @Override
 public int hashCode() {
  int hash = 0;
  hash += (id != null ? id.hashCode() : 0);
  return hash;
 }

 @Override
 public boolean equals(Object object) {
  // TODO: Warning - this method won't work in the case the id fields are not set
  if (!(object instanceof Person)) {
   return false;
  }
  Person other = (Person) object;
  if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
   return false;
  }
  return true;
 }

 @Override
 public String toString() {
  return "net.iocanel.database.entities.Person[id=" + id + "]";
 }
}

```

For this entity we will create a dao interface, through which the rest of the bundles in the container can track/lookup the dao service (the actual implementation).

We want the dao service to provide simple crud operations such as, create, delete, find &amp; findAll, so the dao interface can be something like:

```java

package net.iocanel.database.dao;

import java.util.List;
import net.iocanel.database.entities.Person;

/**
 *
 * @author iocanel
 */
public interface PersonDAO {

 public void create(Person person) throws Exception;
 public void edit(Person person) throws Exception;
 public void destroy(Integer id) throws Exception;
 public Person findPerson(Integer id);
 public List findAllPersons();
}
The actual jpa implementation of the dao will obtain the EntityManager via Spring (it will be injected by Spring) and for transaction demarcation will use Spring’s Transactional annotation:

package net.iocanel.database.dao;

import java.util.List;
import javax.persistence.EntityManager;
import javax.persistence.Query;
import javax.persistence.PersistenceContext;
import net.iocanel.database.entities.Person;
import org.springframework.transaction.annotation.Transactional;

/**
 *
 * @author iocanel
 */
@Transactional
public class PersonJpaDAO implements PersonDAO {

 @PersistenceContext
 private EntityManager entityManager;

 public void create(Person person) throws Exception {
  entityManager.persist(person);
  entityManager.flush();
 }

 public void edit(Person person) throws Exception {
  entityManager.merge(person);
  entityManager.flush();
 }

 public void destroy(Integer id) throws Exception {
  entityManager.remove(findPerson(id));
  entityManager.flush();
 }

 public List findPersonEntities(int maxResults, int firstResult) {
  return findPersonEntities(false, maxResults, firstResult);
 }

 private List findPersonEntities(boolean all, int maxResults, int firstResult) {
  Query q = entityManager.createQuery("select object(o) from Person as o");
  if (!all) {
   q.setMaxResults(maxResults);
   q.setFirstResult(firstResult);
  }
  return q.getResultList();
 }

 public Person findPerson(Integer id) {
  return entityManager.find(Person.class, id);
 }

 public int getPersonCount() {
  Query q = entityManager.createQuery("select count(o) from Person as o");
  return ((Long) q.getSingleResult()).intValue();
 }

 public List findAllPersons() {
  Query q = entityManager.createNamedQuery("Person.findAll");
  return q.getResultList();
 }
}

```

For the EntityManager injection and Spring Transactions, we need need a spring context. Since we are going to use Spring Dynamic Modules, the spring context needs to be placed under META-INF/spring/.

```xml
<beans xmlns:tx="http://www.springframework.org/schema/tx"
 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
 xmlns="http://www.springframework.org/schema/beans"
 xsi:schemalocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans-3.0.xsd
                    http://www.springframework.org/schema/tx http://www.springframework.org/schema/tx/spring-tx-3.0.xsd">

<bean destroy-method="close">
    <property name="driverClassName" value="com.mysql.jdbc.Driver"></property>
    <property name="url" value="jdbc:mysql://localhost:3306/blog"></property>
    <property name="username" value="changeme"></property>
    <property name="password" value="changeme"></property>
    <property name="maxIdle" value="10"></property>
    <property name="maxActive" value="100"></property>
    <property name="maxWait" value="10000"></property>
    <property name="validationQuery" value="select 1"></property>
    <property name="testOnBorrow" value="false"></property>
    <property name="testWhileIdle" value="true"></property>
    <property name="timeBetweenEvictionRunsMillis" value="1200000"></property>
    <property name="minEvictableIdleTimeMillis" value="1800000"></property>
    <property name="numTestsPerEvictionRun" value="5"></property>
    <property name="defaultAutoCommit" value="false"></property>
</bean>

<bean>
    <property name="persistenceUnitName" value="wicket-osgi-pu"></property>
    <property name="dataSource" ref="dataSource"></property>
 </bean>

<bean>
    <property name="entityManagerFactory" ref="entityManagerFactory"></property>
</bean>

<tx:annotation-driven mode="proxy" proxy-target-></tx:annotation-driven>

</beans>
```

For the creation of the EntityManagerFactory Spring will need a persistence.xml file located under META-INF:

```xml
<persistence version="2.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://java.sun.com/xml/ns/persistence" xsi:schemalocation="http://java.sun.com/xml/ns/persistence http://java.sun.com/xml/ns/persistence/persistence_2_0.xsd">
  <persistence-unit name="wicket-osgi-pu" transaction-type="RESOURCE_LOCAL">
    <provider>org.hibernate.ejb.HibernatePersistence</provider>
    <class>net.iocanel.database.entities.Person</class>
    <properties>

      <property name="hibernate.show_sql" value="true"/>

      <property name="hibernate.dialect" value="org.hibernate.dialect.MySQL5Dialect"/>

      <property name="hibernate.cache.use_second_level_cache" value="true"/>
      <property name="hibernate.cache.use_query_cache" value="true"/>
      <property name="hibernate.cache.region_prefix" value=""/>
      <property name="hibernate.cache.region.factory_class" value="net.sf.ehcache.hibernate.EhCacheRegionFactory"/>
      <property name="hibernate.hbm2ddl.auto" value="update"/>

      <property name="hibernate.jdbc.batch_size" value="100"/>
    </properties>
  </persistence-unit>
</persistence>
```

So far in the database tier we did what we would do in a typical application. Now we will add OSGi flavor to our module.


## Creating the DAO OSGi Service {#creating-the-dao-osgi-service}

As mentioned above for the creation of the dao service we will use spring dynamic modules. So all we need is to add a descriptor under META-INF/spring that will instruct Spring’s OSGi exporter to export bean personDAO as OSGi service:

```xml
<beans xmlns:osgi="http://www.springframework.org/schema/osgi"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns="http://www.springframework.org/schema/beans"
        xsi:schemalocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans-3.0.xsd
                            http://www.springframework.org/schema/osgi http://www.springframework.org/schema/osgi/spring-osgi-1.2.xsd">

 <osgi:service interface="net.iocanel.database.dao.PersonDAO" ref="personDAO"/>
</beans>
```

Finally, we need to perform a small hack. In the previous part of this guide, we created an OSGi fragment for Hibernate Validator. This fragment is attached on the validation api host, so that the validation api can find the classes of hibernate validator. However, we still need to instruct the validation api, to look for Hibernate Validator classes. In an non-OSGi world the validation api will lookup in the classpath for the following file META-INF/services/javax.validation.spi.ValidationProvider and read the actual validation provider class name from this file.

Passing the Validation Provider to Validation API
In the OSGi world the validation api, will delegate that call to the calling bundle (in our case the database tier bundle) so we are going to make sure that it finds it. How we are going to do so? We are going to copy it from Hibernate Validator and add it in our bundle. This approach might not seem that elegant, however it has two great advantages:

Its simple
It works
If you are aware of more elegant alternative feel free to communicate them.

The final obstacle is creating the bundle itself.The bundle will be created using maven-bundle-plugin. As maven dependencies it will contain only whatever it requires for the compile scope and its run-time dependencies(hibernate,spring,jpa spec, cglib etc) will be declared as OSGi Import-Packages.

```xml
<properties>
  <export .packages="">net.iocanel.*</export>
  <import .packages="">
   *,
   javax.sql,
   javax.transaction,
   javax.persistence,
   javax.persistence.*,
   javax.persistence.spi,
   javax.persistence.metamodel,
   javax.persistence.criteria,
   org.hibernate,
   org.hibernate.annotations,
   org.hibernate.annotations.common,
   org.hibernate.annotations.common.reflection,
   org.hibernate.ejb,
   org.hibernate.cfg,
   org.hibernate.cfg.annotations,
   org.hibernate.cfg.annotations.reflection,
   org.hibernate.cache,
   org.hibernate.hql,
   org.hibernate.hql.ast,
   org.hibernate.validator,
   org.hibernate.validator.constraints,
   org.hibernate.validator.constraints.impl,
   org.hibernate.validator.engine,
   org.hibernate.validator.engine.groups,
   org.hibernate.validator.engine.resolver,
   org.hibernate.validator.jtype,
   org.hibernate.validator.metadata,
   org.hibernate.validator.util,
   org.hibernate.validator.util.annotationfactory,
   org.hibernate.validator.xml,
   org.hibernate.proxy,
   com.mysql.jdbc,
   javassist.util.proxy,
   org.aopalliance.aop,
   org.springframework.aop,
   org.springframework.aop.framework,
   net.sf.cglib.core,
   net.sf.cglib.reflect,
   net.sf.cglib.proxy
  </import>
  <private .packages="">!*</private>
  <symbolic .name="">${pom.groupId}.${pom.artifactId}</symbolic>
  <unpack-bundle>false</unpack-bundle>
 </properties>

 <build>
  <plugins>
   <plugin>
    <group>org.apache.felix</groupid>
    <artifact>maven-bundle-plugin</artifactid>
    <extensions>true</extensions>
    <configuration>
     <instructions>
      <bundle-name>${artifactId}</bundle-name>
      <bundle-symbolicname>${symbolic.name}</bundle-symbolicname>
      <bundle-description>${pom.name}</bundle-description>
      <bundle-classpath>.</bundle-classpath>
      <import-package>${import.packages}</import-package>
      <export-package>${export.packages}</export-package>
      <private-package>${private.packages}</private-package>
     </instructions>
    </configuration>
   </plugin>
</plugins>
</build>
```


## Presentation/Web Tier {#presentation-web-tier}

For the presentation tier we are going to be a Wicket OSGi application. This application will be integrated with Spring using @SpringBean annotation (more details on this on Wicket/Spring Wiki).

Since we are interested in taking advantage of Spring Dynamic Modules, we are going to instruct to load its context from OsgiBundleXmlWebApplicationContext inside the web.xml.

```xml
<web-app version="2.5" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://java.sun.com/xml/ns/j2ee" xsi:schemalocation="http://java.sun.com/xml/ns/j2ee http://java.sun.com/xml/ns/j2ee/web-app_2_4.xsd">

 <display-name>web-tier</display-name>

 <context-param>
  <param-name>wicket.configuration</param-name><param-value>development</param-value></context-param>

 <context-param>
  <param-name>contextClass</param-name><param-value>org.springframework.osgi.web.context.support.OsgiBundleXmlWebApplicationContext</param-value></context-param>

 <listener>
  <listener->org.springframework.web.context.ContextLoaderListener</listener-class>
 </listener>
 <filter>
  <filter-name>wicket.wicket-spring</filter-name>
  <filter->org.apache.wicket.protocol.http.WicketFilter</filter-class>
  <init-param>
   <param-name>applicationFactoryClassName</param-name><param-value>org.apache.wicket.spring.SpringWebApplicationFactory</param-value></init-param>
  <init-param>
   <param-name>applicationClassName</param-name><param-value>net.iocanel.WicketApplication</param-value></init-param>
 </filter>
 <filter-mapping>
  <filter-name>wicket.wicket-spring</filter-name>
  <url-pattern>/*</url-pattern>
 </filter-mapping>
</web-app>
```

The Spring context file (/WEB-INF/applicationContext.xml)that will be loaded needs to define two simple things:

The Wicket Application Object.
The PersonDAO OSGi service.
The PersonDAO service will be looked up using Spring Dynamic Modules. Inside the wicket application the PersonDAO service will be injected as if it was a normal spring bean using the @SpringBean annotation.

```xml
<beans xmlns:osgi="http://www.springframework.org/schema/osgi" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.springframework.org/schema/beans" xsi:schemalocation="http://www.springframework.org/schema/beans
    http://www.springframework.org/schema/beans/spring-beans-3.0.xsd
    http://www.springframework.org/schema/osgi http://www.springframework.org/schema/osgi/spring-osgi-1.2.xsd">

<bean>
    <osgi:reference interface="net.iocanel.database.dao.PersonDAO"/>
</bean>

</beans>
```

We are almost there. All that’s left is the coding of the actual crud. I will not go into much detail, since its beyond the scope of this blog post. However, I am going to list the key points of the crud.


## The C.R.U.D. {#the-c-dot-r-dot-u-dot-d-dot}

For the CRUD part we will create a single ajax page that will display:

A list of all persons in the database.
A small form to insert/edit person details.
Buttons for each record to edit/remove persons in the database.
The List Component that will be used is PropertyListView, and the model attached to list will be a LoadableDetachableModel that will load all persons from the database. Finally the person details form will consist of 2 text fields First Name &amp; Last Name.

{{< figure src="images/ui.png" caption="<span class=\"figure-number\">Figure 1: </span>The user interface." >}}

Enjoy!

The full source for this example (including the custom bundles) can be found at my github repository. Once you unpack it you can mvn clean install and it will package the project bundles, the custom bundles and all the required bundles under target/wicket-osgi.dir/deploy folder. Just copy the contents of this folder to $KARAF_HOME/deploy and you are ready launch the application at <http://localhost:8181/web-tier/>.


## Final thoughts {#final-thoughts}

I hope you find this useful.
Once my schedule allows, I will blog on how to add JTA transactions on the example above, so stay tuned(The Hibernate bundle is JTA ready, however we need a JTA transaction manager bundle).
Feel free to send comments or suggestions.
