+++
title = "Using Quarkus with the Service Binding Operator"
author = ["Ioannis Canellos"]
description = "A quick walkthrough on how to use Quarkus with the Service Binding Operator"
date = 2021-11-29T17:56:00+02:00
draft = false
categories = ["development"]
tags = ["java", "quarkus", "kubernetes"]
+++

## Introduction {#introduction}

[Kubernetes](https://kubernetes.io) is around for almost 7 years now!
Ever since the beggining there have been efforts to make consuming / binding to services simpler.
And while discovering the actual service is not so much of an issue
(if you employ a set of conventions), getting the credentials etc is slightly trickier.

The [Service Catalog](https://svc-cat.io) has been an effort that promised to simplify provisioning and binding to
services, but it seems that it has lost its momentum.
The lack of uniformity between providers, the differences in how each service communicated
the binding information and the fact that people tend to favor operators for provisioning services
made it pretty hard to use in practice.

The [Service Binding Operator](https://github.com/redhat-developer/service-binding-operator) is a more recent and modern initiative.
It stays out of the way of service provisioning (leaving that to operators) and
focuses on how to best communicate the binding information to the application.
An interesting part of the specification is the [workload projection](https://github.com/servicebinding/spec#workload-projection), which defines a directory
structure that will be mounted to the application container when the binding happens in order to
pass all the required binding information:

-   type
-   uri
-   credentials

Other parts of the specification are related to the \`ServiceBinding\` resource (which controls what
services are bound to which application and how).

[Quarkus](https://quarkus.io/) already supports the [workload projection](https://github.com/servicebinding/spec#workload-projection) part of the spec and recently received enhancments
on the binding part, which is going to be the focus of this post.
In particular this post is going to discuss how the \`ServiceBinding\` can be automatically
genenerated for the user and will walk you through the whole process from installing the needed
operators to configuring and deploying the application.

For the shake of this post we are going to use [kind](https://kind.sigs.k8s.io/) install the [Service Binding Operator](https://github.com/redhat-developer/service-binding-operator) and
the [Crunchy data operator for Postgres](https://github.com/CrunchyData/postgres-operator).
Then, we are going to create a postgres cluster and finally we will create a simple todo application,
deploy and bind it to the provisioned postgres.


## Start a new kind cluster {#start-a-new-kind-cluster}

If you've already created one, or don't use [kind](https://kind.sigs.k8s.io/) at all, feel free to skip.

```sh
  kind create cluster
```


## Install the OLM {#install-the-olm}

Both operators that will be installed in this post, will be installed through the [Operatorhub](https://operatorhub.io).
So, the first step is to install the [Operator Lifecycle Manager](https://olm.operatorframework.io/).

```sh
  curl -sL https://github.com/operator-framework/operator-lifecycle-manager/releases/download/v0.19.1/install.sh | bash -s v0.19.1
```


## Install the Service Binding Operator {#install-the-service-binding-operator}

```sh
  kubectl create -f https://operatorhub.io/install/service-binding-operator.yaml
```

To verify the installation execute the following command.

```sh
    kubectl get csv -n operators -w
```

When the \`phase\` of the [Service Binding Operator](https://github.com/redhat-developer/service-binding-operator)  is \`Succeeded\` you may proceed to the next step.


## Install the Postgres Crunchy Operator {#install-the-postgres-crunchy-operator}

```sh
  kubectl create -f https://operatorhub.io/install/postgresql.yaml
```

As above to verify the installation execute:

```sh
    kubectl get csv -n operators -w
```

When the \`phase\` of the operator is \`Succeeded\` you may proceed to the next step.


## Create a Postgres cluster {#create-a-postgres-cluster}

We shall create a new namespace, where we will install our cluster and application:

```sh
     kubectl create ns demo
     kubectl config set-context --current --namespace=demo
```

To create the cluster we need to apply the following custom resource:

```yaml
     apiVersion: postgres-operator.crunchydata.com/v1beta1
     kind: PostgresCluster
     metadata:
       name: pg-cluster
       namespace: demo
     spec:
       image: registry.developers.crunchydata.com/crunchydata/crunchy-postgres-ha:centos8-13.4-0
       postgresVersion: 13
       instances:
         - name: instance1
           dataVolumeClaimSpec:
             accessModes:
             - "ReadWriteOnce"
             resources:
               requests:
                 storage: 1Gi
       backups:
         pgbackrest:
           image: registry.developers.crunchydata.com/crunchydata/crunchy-pgbackrest:centos8-2.33-2
           repos:
           - name: repo1
             volume:
               volumeClaimSpec:
                 accessModes:
                 - "ReadWriteOnce"
                 resources:
                   requests:
                     storage: 1Gi
           - name: repo2
             volume:
               volumeClaimSpec:
                 accessModes:
                 - "ReadWriteOnce"
                 resources:
                   requests:
                     storage: 1Gi
       proxy:
         pgBouncer:
           image: registry.developers.crunchydata.com/crunchydata/crunchy-pgbouncer:centos8-1.15-2
```

This resource has been borrowed from [Service Binding Operator Quickstart](https://redhat-developer.github.io/service-binding-operator/userguide/getting-started/quick-start.html), which is
definitely something worth looking into (if you haven't already).

Let's save that file under \`pg-cluster.yml\` and apply it using \`kubectl\`

```sh
     kubectl apply -f ~/pg-cluster.yml
```

Let's check the pods to verify the installation:

```sh
   kubectl get pods -n demo
```


### Create a Quarkus application that will bind to Postgres {#create-a-quarkus-application-that-will-bind-to-postgres}

The application we are going to create is going to be a simple \`todo\` application that will
connect to postgres via hibernate and panache.

The application that we will create is heavily inspired by [Clement Escoffier's Quarkus TODO app](https://github.com/cescoffier/quarkus-todo-app),
but will focus less on the presentation and more on the binding aspect.

We will generate the application using the following maven command.

```sh
     mkdir -p ~/demo
     cd ~/demo
     mvn io.quarkus.platform:quarkus-maven-plugin:2.5.0.Final:create -DprojectGroupId=org.acme -DprojectArtifactId=todo-example -DclassName="org.acme.TodoResource" -Dpath="/todo"
     cd todo-example
```

The next step is to add all required extensions for connecting to postgres, generating all required
kubernetes resources and building the a container image for our application using docker.

```sh
   ./mvnw quarkus:add-extension -Dextensions="resteasy-jackson,jdbc-postgresql,hibernate-orm-panache,kubernetes,kubernetes-service-binding,container-image-docker"
```

At this point we need to create a simple entity:

```java
     package org.acme;

     import javax.persistence.Column;
     import javax.persistence.Entity;

     import io.quarkus.hibernate.orm.panache.PanacheEntity;

     @Entity
     public class Todo extends PanacheEntity {

         @Column(length = 40, unique = true)
         public String title;

         public boolean completed;

         public Todo() {
         }

         public Todo(String title, Boolean completed) {
             this.title = title;
         }
     }
```

And expose that via rest:

```java
     package org.acme;

     import javax.transaction.Transactional;
     import javax.ws.rs.*;
     import javax.ws.rs.core.Response;
     import javax.ws.rs.core.Response.Status;
     import java.util.List;

     @Path("/todo")
     public class TodoResource {

         @GET
         @Path("/")
         public List<Todo> getAll() {
           return Todo.listAll();
         }

         @GET
         @Path("/{id}")
         public Todo get(@PathParam("id") Long id) {
             Todo entity = Todo.findById(id);
             if (entity == null) {
                 throw new WebApplicationException("Todo with id of " + id + " does not exist.", Status.NOT_FOUND);
             }
             return entity;
         }

         @POST
         @Path("/")
         @Transactional
         public Response create(Todo item) {
             item.persist();
             return Response.status(Status.CREATED).entity(item).build();
         }

         @GET
         @Path("/{id}/complete")
         @Transactional
         public Response complete(@PathParam("id") Long id) {
             Todo entity = Todo.findById(id);
             entity.id = id;
             entity.completed = true;
             return Response.ok(entity).build();
         }


         @DELETE
         @Transactional
         @Path("/{id}")
         public Response delete(@PathParam("id") Long id) {
             Todo entity = Todo.findById(id);
             if (entity == null) {
                 throw new WebApplicationException("Todo with id of " + id + " does not exist.", Status.NOT_FOUND);
             }
             entity.delete();
             return Response.noContent().build();
         }
     }
```

<!--list-separator-->

-  Bind to the target Postgres cluster

    In order to bind the postgres service to our application we need to either provide a \`ServiceBidning\` resource or have it generated.
    To have the binding generated for us we need to provide the service coordinates:

    -   apiVersion: \`postgres-operator.crunchydata.com/v1beta1\`
    -   kind: \`PostgresCluster\`
    -   name: \`pg-cluster\`

        prefixed with \`quarkus.kubernetes-service-binding.services.&lt;id&gt;.\` as shown below:

    <!--listend-->

    ```text
           quarkus.kubernetes-service-binding.services.my-db.api-version=postgres-operator.crunchydata.com/v1beta1
           quarkus.kubernetes-service-binding.services.my-db.kind=PostgresCluster
           quarkus.kubernetes-service-binding.services.my-db.name=pg-cluster
    ```

    The \`id\` is just used to group properties together and can be anything.

    In addition to the configuration above we also need to configure the datasource:

    ```text
           quarkus.datasource.db-kind=postgresql
           quarkus.hibernate-orm.database.generation=drop-and-create
           quarkus.hibernate-orm.sql-load-script=import.sql
    ```

    Finally, we will use \`IfNotPresent\` as image pull policy since we are not pushing our
    image to a registry and we just load it to the cluster.

    ```text
          quarkus.kubernetes.image-pull-policy=IfNotPresent
    ```

    So, the application.properties file should look like:

    ```text
           quarkus.kubernetes-service-binding.services.my-db.api-version=postgres-operator.crunchydata.com/v1beta1
           quarkus.kubernetes-service-binding.services.my-db.kind=PostgresCluster
           quarkus.kubernetes-service-binding.services.my-db.name=pg-cluster

           quarkus.datasource.db-kind=postgresql
           quarkus.hibernate-orm.database.generation=drop-and-create
           quarkus.hibernate-orm.sql-load-script=import.sql

           quarkus.kubernetes.image-pull-policy=IfNotPresent
    ```

    Now, let's create an import sql script with some intial data.

    ```sql
           INSERT INTO todo(id, title, completed) VALUES (nextval('hibernate_sequence'), 'Finish the blog post', false);
    ```


## Prepare for deployment {#prepare-for-deployment}

To deploy, we need to perform a container image build, load the image to our cluster
(remember we are using [kind](https://kind.sigs.k8s.io/)), generate the resource and perform the deployment.

<!--list-separator-->

-  Build the container image

    To build the container image, you can use:

    ```sh
           mvn clean install -Dquarkus.container-image.build=true -DskipTests
    ```

    This assumes that you have docker up and running.

<!--list-separator-->

-  Load the docker image to the cluster

    ```sh
         kind load docker-image iocanel/todo-example:1.0.0-SNAPSHOT
    ```

    <!--list-separator-->

    -  Loading the image on minikube

        If you are using [minikube](https://minikube.sigs.k8s.io/docs/start/) instead, then execute:

        ```sh
             eval $(minikube docker-env)
        ```

        and re-build the image.

        When using tools like [kind](https://kind.sigs.k8s.io/) or [minikube](https://minikube.sigs.k8s.io/docs/start/), it is generally a good idea to change the image
        pull policy to \`IfNotPresent\` to avoid uneeded pulls, since most of the time the image
        will be loaded from the local docker daemon, as shown above.
        To set the image pull policy, we set \`quarkus.kubernetes.image-pull-policy=IfNotPresent\`
        as already shown above.


## Deploy the application {#deploy-the-application}

The next step will generate the deployment manifest, including the \`ServiceBinding\` and will apply
them on kubernetes.

```sh
    mvn clean install -Dquarkus.kubernetes.deploy=true -DskipTests
```

To verify everything is up and running:

```sh
   kubectl get pods -n demo -w
```


## Verify the installation {#verify-the-installation}

The simplest way to verify that everything works as expected is to port forward to http port
locally and access the \`/todo\` endpoint:

```sh
    kubectl port-forward service/todo-example 8080:80
```

Open your browser on <http://localhost:8080/todo> and enjoy!


## Thoughts and future steps {#thoughts-and-future-steps}

I am really excited with the progress on the Service binding front. Thinks are looking great and
can look even better.
Some potential improvements I can see coming in the near future, is reducing the amount of needed
configuration, with the use of smart conventions (e.g. assuming that custom resource name is the i
same as the database name unless explicitly specified) and a reasonable set of defaults
(e.g. assuming that for postgres the default operator is [CrunchyData operator](https://github.com/CrunchyData/postgres-operator)).
This could even allow us to bind to services with zero config, without really sacrificing in
flexibility and customizability!

I hope I could get you even half as excited as I am!


## The end {#the-end}
