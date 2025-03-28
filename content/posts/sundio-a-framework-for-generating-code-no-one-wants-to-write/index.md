+++
title = "Sundrio: A framework for generating code that no one wants to write"
author = ["Ioannis Canellos"]
description = "Short introduction to sundrio"
date = 2021-08-05T09:19:00+03:00
draft = false
categories = ["development"]
tags = ["sundrio"]
+++

## Intro {#intro}

I used to be pretty vocal about things I work on. I used to write blogs, give conference talks or occasionally create short vlog kind of videos. If there is one topic I've completely missed, that is [sundrio](https://github.com/sundrio/sundrio).

So, what is [sundrio](https://github.com/sundrio/sundrio) ?

[sundrio](https://github.com/sundrio/sundrio) is a code generation toolkit for generating code that no one wants to write by hand and everyone enjoys using.
Besides the code generation frameworks, it also comes with modules (they are actually framework applications) for generating things like:

-   Builders
-   Domain Specific Languages
-   Any kind of boiler plating code (via templates)

and can be used in many different contexts including annotation processing, build tool plugins and more.


## A little bit of history {#a-little-bit-of-history}

At some point I used to work on project that contained many different builders. Everyone on the project agreed on the value of immutability and builders. Unfortunately, everyone had a different idea on how a builder should look like.
Some builders were using prefixes like \`with\`, others were using \`set\`, others no prfeix at all and there were even builders with no \`build\` method. It was clear to me that a tool for generating those builders was needed.
And based on my experiences that generator needed to support at least:

-   Object hierarchies
-   Nesting

This was a tool I never found the time to create.

In September 2014, I was sitting with a colleague in the airport in Rome waiting for my connecting flight. After dinner, he grabbed his laptop and started coding. He mentioned that he was experimenting on an annotation processor of shorts to solve a problem he had.
I took out my laptop too and started a poc on an annotation processor that would generate simple builders. Over time the builders became less simple and I started adding more and more features ...
Still, I didn't have the time to make it a real project and properly promote it ...

And then [kubernetes](https://kubernetes.io) happened!

I had the privilege to work on a team of early adopters and we started doing [kubernetes](https://kubernetes.io) things in java.

The code used to look like:

```java
   Pod pod = new Pod();
   Metadata metadata = new Metadata();
   metadata.setName("my-pod");

   Container container = new Container();
   container.setName("nginx");
   container.setImage("nginx:1.20.1");

   PodSpec spec = new PodSpec();
   spec.setContainers(Arrays.asList(container));

   pod.setMetadata(metadata);
   pod.setSpec(spec)
```

... and it got uglier and uglier as more complex resources came into picture!

So, I decided to try out my builder generator the [kubernetes](https://kubernetes.io) domain and see how it would look like.

```java
   Pod pod = new PodBuilder()
                    .withNewMetadata()
                       .withName("my-pod")
                    .endMetadata()
                    .withNewSpec()
                        .addNewContainer()
                            .withName("nginx")
                            .withImage("nginx:1.20.1")
                        .endContainer()
                    .endSpec()
                    .build();
```

While the amount of code is not significantly less, it is way more fluent and it becomes much easier to read and write due to its structural similarity with how these resources are represented in json or yaml:

```yaml
kind: Pod
metadata:
  name: my-pod
spec:
  containers:
    - name nginx
    - image: ngnix:1.20.1
```

On top of that add the completion offered by modern IDEs and you get something way more pleasant to use.

So, the builder generator was released as project called [sundrio](https://github.com/sundrio/sundrio) so that it can be used by the [fabric8](https://fabric8.io) [kubernetes](https://kubernetes.io) client.
Later on, the official [kubernetes](https://kubernetes.io) client also adopted [sundrio](https://github.com/sundrio/sundrio), so you could say [sundrio](https://github.com/sundrio/sundrio) builders have become the standard way to manipulate [kubernetes](https://kubernetes.io) resources in java.

Over time, different features and modules were added that could be used outside of the context of builder generators, so it's pretty much more like a library/framework for code generation rather than anything else.


## Using sundrio {#using-sundrio}

In this section I'll walk you around the core sundrio concepts. I will start with the core java framework, which you can use for code generation and then I'll focus on applications of the framework which can be used by users
without having to worry much about the sundrio internals (e.g. the builder generator).


### Manipulating java code {#manipulating-java-code}

In the core of [sundrio](https://github.com/sundrio/sundrio) lies the domain model, which represents core java types and consturcts. It can be used to define types programmatically that can be then rendered into source:

```java
  TypeDef greeter = new TypeDefBuilder()
                        .withKind(Kind.Inteface)
                        .withName("Greeter")
                        .addNewMethod()
                            .withName("helloWorld")
                        .endMethod()
                        .build();

  System.out.println(greeter.render());
```

The code above will output:

```java
   interface Greeter {
      void helloWorld();
   }
```

Of course, no one really defines types from scratch programmatically. In most cases an input is used. The input is usually an other class in the form of source or class file.
So sundrio, provides a series of adapters that people can use to adapt existing classes, source files, etc into \`TypeDef\` instances.


#### Annotation procssing {#annotation-procssing}

One of the most common cases is when using annotation processing:

```java
     AptContext aptContext = AptContext.create(processingEnv.getElementUtils(), processingEnv.getTypeUtils());
     TypeDef typeDef = Adapters.adaptType(typeElement, AdapterContext.getContext());
```

The code above demonstrates how to convert a \`TypeElement\` into a \`TypeDef\`.

<!--list-separator-->

-  What is a TypeElement

    Annotation processors are being invoked by the compiler before the end of the compilation process. At that point there are no classes available for code being processed.
    So, annotation processors have to use an intermediate way to represent the actual type, that is called \`TypeElement\`.

    In other words the previous example, demonstrated how to get a \`TypeDef\` from the internal compiler representation of a type.


#### Reflection {#reflection}

Of course, annotation processing is not the only way to deal with types. A maven / gradle plugin would deal with classes and reflection instead.
So, in this case the one would do something like:

```java
   TypeDef typeDef = Adapters.adaptType(SomeClass.class, AdapterContext.getContext());
```

In a similar way one could parse existing source files and still get a \`TypeDef\`. Having a single programming model regardless of the context and input chanels is very powerful as it allows you to write the code once and use it in multiple different contexts.
An example of this application is the [fabric8](https://fabric8.io) [kubernetes](https://kubernetes.io) crd generator, which can be used either via annotation processing or maven plugins.


#### Performing complex manipulations {#performing-complex-manipulations}

When dealing with java type representations there is often a large amount of nesting and recursion involved. For example dealing with types that contain self references, cyclic refrences etc. This makes perfroming code manipulation pretty tricky, as its quite complex to navigate the object graph.
Lucky for as there is a known patten for decoupling an algorithm from the object strucutre its applied, the [visitor pattern](https://en.wikipedia.org/wiki/Visitor_pattern).

This pattern has been backed inside the [sundrio](https://github.com/sundrio/sundrio) model itself but also in the builders that it generates.

[sundrio](https://github.com/sundrio/sundrio) visitors allow you to specify a function that will applied to all applicable nodes of the builder object graph without requiring you to have any explicit knowledge of its structure or implement any kind of traversing logic.

<!--list-separator-->

-  A visitor example

    Let\`s imagine that you need to convert all primitive refernces in class to their boxed equivallents. Such references, may be part of the class fields, method arguments, constructor arguments, nested class fields, nested method arguments and so on ...

    ```java
          TypeDef converted = new TypeDefBuilder(original)
                                     .accept(new TypedVisitor<PropertyBuilder>() {
                                      public void visit(PropertyBuilder property) {
                                        if (property.getTypeRef() instanceof PrimitiveRef) {
                                            property.withTypeRef(io.sundr.model.utils.Types.box(property.getTypeRef()));
                                        }
                                      }}).build();
    ```

    In the example above the \`visit\` method will be called for all properties in the \`original\` type, without putting any effort in navigating and finding these properties.
    **Note:** The builder generator will generated visitor support for free, so this is something that can become available to your domain too.

    <!--list-separator-->

    -  Visitors in the kubernetes model

        A real world application is the [fabric8](https://fabric8.io) [kubernetes](https://kubernetes.io) model, that supports visitors for [kubernetes](https://kubernetes.io) resources.

        Let's add the \`foo\` / \`bar\` label to all resources in the list.

        ```java
              KubernetesList list = new KubernetesListBuilder(original)
                                          .accept(new TypedVisitor<ObjectMetaBuilder>() {
                                           public void visit(ObjectMetaBuilder metadata) {
                                               metadata.addToLabels("foo", "bar");
                                           }
                                         }).build();

        ```

        The feature above has become the building block on top of which the [dekorate](https://github.com/dekorateio/dekorate) has been built ([dekorate](https://github.com/dekorateio/dekorate) is a collection of such visitors that are acompanied by an intuitive config mechanism that controlls their application, providing an easy to use [kubernetes](https://kubernetes.io) resource generation framework for java).


### Generating builders {#generating-builders}

To generate builders for your application, you need to add:

```xml
     <dependency>
       <groupId>io.sundr</groupId>
       <artifactId>builder-annotations</artifactId>
       <version>0.50.0</version>
     </dependency>
```

And then add the annotation \`@io.sundr.builders.annotations.Buildable\` on the class you want to generate builders for.

The generated builders will use the available constructors to determine which fields will be used by the builder, so if you have multiple non-empty constructors you can choose the constructor of choice by placing the \`@Buildable\` annotation on top of it.
Otherwise you can just place it on top of the class.

Did I say class? Well, the \`@Buildalbe\` annotations can be also placed on top of interfaces or records and it will work equally well. In the former case a pojo will generated to as an implementation for the interface. An additional annotation called \`@Pojo\` also existis that will give more control over the generated code.

Below is how \`@Buildable\` would be used in a regular pojo.

```java
     @Buildable
     public class Person {
       private final String firstName;
       private final String lastName;


       public Person(String firstName, String lastName) {
         this.firstName;
         this.lastName;
       }

       public String getFirstname() {
        return this.firstName;
       }

       public String getLastname() {
         return this.lastName;
       }
     }
```

Things to remember regarding the fields exposed to the builder:

-   A non-empty constructor is required.
-   Getters are required.

The generated builder could be used:

```java
     Person p = new PersonBuilder().withFirstName("John").withLastName("Doe").build();
```


#### Using interfaces {#using-interfaces}

If \`Person\` was an interface instead:

```java
     @Buildalbe
     public interface Person {
       String getFirstName();
       String getLastName();
     }
```

This would trigger the generation of a class that would look like:

```java
     @Buildalbe
     public class DefaultPerson {

       private final String firstName;
       private final String lastName;

       public Person(String firstName, String lastName) {
         this.firstName;
         this.lastName;
       }

       public String getFirstname() {
        return this.firstName;
       }

       public String getLastname() {
         return this.lastName;
       }
     }
```

And of course in this case, the generated builder would be used:

```java
     Person p = new DefaultPersonBuilder().withFirstName("Jane").withLastName("Doe").build();
```


#### Using records {#using-records}

A couple of weeks ago records support has been added, that makes the following code possible:

```java
      @Buildable
      public record Person(String firstName, String lastName) {
      }
```

Which is the most copact of all and highly recommended if you are on jdk16+.
The only downside with \`records\` is that they are represented by \`final\` classes and often \`@Buildable\` fun comes from inheritance ...


#### Using inheritance and nesting {#using-inheritance-and-nesting}

What happens when a \`@Buidlable\` annotated class extends another, or has a field of another?
The generated builders will take into consideration the account hierarchy, for example:

```java
      @Buildable
      public class Student extends Person {

        private final Map<String, Integer> grades;
        private final Person guardian;

        public Student(String firstName, String lastName, Person guardian, Map<String, Integer> grades>) {
          super(firstName, String lastName);
          this.guardian = guardian;
          this.grades = grades;
        }

        public Person getGuardian() {
          return this.guardian;
        }

        public Map<String, Integer> getGrades() {
          return this.grades;
        }
      }
```

The generated builder could be used like:

```java
      Student s = new StudentBuilder().withFirstName("Junior").withLastName("Doe")
          .withNewGuardian()
            .withFirstName("Jane")
            .withLastName("Doe")
          .endGuardian()
          .addToGrades("Math", 100)
          .addToGrades("Physics", 100)
          .build();
```

Note that regular fields can be set using methods prefixed with the \`with\` keyword. When fields are \`@Buildable\` we get the option to directly access their build via the \`withNew\` perfix. The nested object is finally built when the matching \`end\` method is called.
In other words the code above is equivalent to:

```java
      Student s = new StudentBuilder().withFirstName("Junior").withLastName("Doe")
          .withGuardian(new PersonBuilder()
            .withFirstName("Jane")
            .withLastName("Doe")
            .build())
          .addToGrades("Math", 100)
          .addToGrades("Physics", 100)
          .build();
```

I find that former example (the one that was using \`withNew\`) is more readable and more fluent.


### Using templates {#using-templates}

Sometimes, it might be easier to use a [sundrio](https://github.com/sundrio/sundrio) along with a template engine, like velocity or string template.

Let's imagine that we want to write some code that creates a \`Singleton\` / \`Holder\` for a class:

```java
    TypeDef singleton = new TypeDefBuilder()
                              .withName(original.getName() + "Holder")
                              .addNewProperty()
                                 .withModifiers(Types.modifiersToInt(Modifier.PUBLIC, Modifier.STATIC))
                                 .withName("INSTNACE")
                                 .withType(original.toReference())
                              .endProperty()
                              .addNewMethod()
                                 .withModifiers(Types.modifiersToInt(Modifier.PUBLIC, Modifier.STATIC))
                                 .withName("getInstance()")
                                 .withReturnType(original.toReference())
                                 .withBody()
                                   .addNewStringStatement("return INSTANCE != null ? INSTANCE : new " + original.getName() + "();")
                                 .endBody()
                              .endMethod()
```

While not ideal, the code above may feel a bit verbose and may would rather use template engine instead:

```java
    package ${model.packageName}

    public ${model.className}Holder {
      private static final ${model.toRefence()} INSTANCE;

      public static ${model.toRefence()} getInstance() {
        return INSTANCE != null ? INSTANCE : new ${model.toReference()}();
      }
    }
```

This can be streamlined by adding the template to your resources (say in a file called \`holder.vm\`) and then using \`io.sundr.transform.annotations.TemplateTranformation\` on your class:

```java
    @TemplateTransformation("/holder.vm")
    public class Context {
      //blah blah
    }
```

This requires two additonal dependencies:

```xml
     <dependency>
       <groupId>io.sundr</groupId>
       <artifactId>transform-annotations</artifactId>
       <version>0.50.0</version>
     </dependency>
```

and ...

```xml
      <dependency>
        <groupId>io.sundr</groupId>
        <artifactId>sundr-codegen-velocity</artifactId>
        <version>0.50.0</version>
      </dependency>
```

At the moment velocity and string template are supported as template engines. This example is using velocity. To convert it to string template one would have to just change the template (including the extension to \`st\`) and then add:

```xml
     <dependency>
       <groupId>io.sundr</groupId>
       <artifactId>sundr-codegen-st4</artifactId>
       <version>0.50.0</version>
     </dependency>
```

A generated class \`ContextHolder\` will be automatically generated for you.


## Future plans and thoughts {#future-plans-and-thoughts}

This blog post proved to be longer than I intially intended, so time to wrap up!

The project was recently refactored to address some of the technical dept but also to make it more modular and usable as a codegeneration framework.
If I find time, I intend to do some cleaning in the builder and dsl applications as well, but most importantly to provide non-annotation processing entrypoints to them.

Hope, it doesn't take me that long for my next post!

See ya!
