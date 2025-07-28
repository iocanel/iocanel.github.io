+++
title = "Workflows everywhere pt. 1"
author = ["Ioannis Canellos"]
date = 2025-07-06
draft = false
+++

## Introduction {#introduction}

Workflows are everywhere. From CI/CD pipelines, all system / data integration to business process automation.
It wouldn't be too far-fetched to say that even modern software build tools
like make, maven or npm are used to define workflows.

There are countless tools out there that help people define,
execute and monitor workflows varying from simple no-code tools to complex
frameworks that allow developers to define workflows in code, or even architect
their software as workflows.

Today, the rise of [Agentic AI](https://en.wikipedia.org/wiki/Agentic_AI) amplifies the need for workflows. As
agents need to integrate and coordinate with external systems and other
agents, workflows provide a structured way to manage these interactions.


## What is a workflow? {#what-is-a-workflow}

A [Workflow](https://en.wikipedia.org/wiki/Workflow) is a repeatable, orchestrated sequence of activities/steps that
transforms inputs into desired outputs by passing documents, data, or work
items between processing entities—humans, services, or agents—under a defined
control flow, triggers, and data-management rules.


### Key Characteristics {#key-characteristics}


#### Automation of Procedures {#automation-of-procedures}

Breaking a larger process into discrete “atomic” steps that an engine (software)
can schedule and execute, without human intervention once triggered.
In some cases a human may be added in the loop to approve or review a step
but the control of the flow should not be in the hands of the human.
This is often encountered in [BPMN](https://en.wikipedia.org/wiki/Business_Process_Model_and_Notation)-based
workflows. The diagram below shows a simplified workflow for a loan approval
process that consists of multiple automated steps and a human approval step.

{{< figure src="workflow-automation.png" >}}


#### Control Flow and Dependencies {#control-flow-and-dependencies}

As already implied by the previous example a workflow is not just a collection
of activities executed without human orchestration. A workflow also defines:

-   Triggers
-   Execution order
-   Branching
-   Dependencies

The diagram below shows these concepts in a simplified back-office workflow
for processing pending orders.

{{< figure src="workflow-control-flow.png" >}}

Let's examine these concepts in more detail:

<!--list-separator-->

-  Triggers

    Triggers initiate workflows based on events, schedules, or conditions.
    They can be time-based (e.g., daily at 18:00) or event-based (e.g., new
    data arrival).

<!--list-separator-->

-  Execution Order

    Workflow schemas define the precise routing logic that drives a workflow’s
    progression. They are often represented as Directed Acyclic Graphs (DAGs).

<!--list-separator-->

-  Branching

    A workflow can branch into multiple paths either based on conditions (eg
    if-else) or for the shake of parallelism (fan-out). In messaging terminology,
    these branching patterns are often refered to as [Content-Based Routers](https://www.enterpriseintegrationpatterns.com/patterns/messaging/ContentBasedRouter.html) or
    [Recipient Lists](https://www.enterpriseintegrationpatterns.com/patterns/messaging/RecipientList.html) respectively.

<!--list-separator-->

-  Dependencies

    The opposite of branching is merging. An activity that has multiple dependencies
    needs to wait until all its dependencies are satisfied before it can execute.
    And since we did mention messaging patterns, this is often referred to as
    [Aggregator](https://www.enterpriseintegrationpatterns.com/patterns/messaging/Aggregator.html).

    This requirement is important as this means that the workflow engine must track of
    the state and dependencies of each activity.


## Implementing Workflows {#implementing-workflows}

Now that we have defined the functionality of a workflow, let's take a
moment to think how we could implement a workflow.


### Can we use a programming language? {#can-we-use-a-programming-language}

Of course we can. After all a computer program itself is pretty similar to a workflow. The main
difference is that workflows focuses on activities, while a program focuses on instructions.

So why don't we just do it ? And maybe use libraries that can help us abstract some of the commonly used patterns ?


### Non functional requirements {#non-functional-requirements}

In Software Engineering we rarely stop at defining the functional characteristics
of a problem. We also need to take the quality characteristics into consideration.
In other words we need to consider how well our solution needs to address
this problems, we need to consider the non functional requirements

So what are the non-functional requirements applicable to workflows?

#### Performance {#performance}

The ability to execute workflows within acceptable time limits, ensuring
that activities are completed efficiently.
Performance metrics include:

-   Workflow startup time
-   Activity execution latency
-   Task scheduling efficiency
-   Resource utilization


#### Scalability {#scalability}

The system should be capable of:

-   Handling an increasing number of concurrent workflows
-   Managing workflows that include a large number of steps
-   Processing high-volume input/output data


#### Reliability and Availability {#reliability-and-availability}

The ability to execute workflows without downtime, even in the face of failures.
For example, a workflow shoud be executed even if some of the workers are down.


#### Durability and Persistence {#durability-and-persistence}

The ability to persist workflow state and history, so that:

-   Progress is not lost on restart or failure
-   Execution history is available for audits or rollbacks
-   Long-running or paused workflows can resume correctly


#### Observability {#observability}

The ability to monitor workflow execution, track progress, and debug issues.
Developers and operators should have access to:

-   Workflow status and execution paths
-   Logs, metrics, and traces for each workflow instance
-   Alerts for failures or anomalies


#### Consistency {#consistency}

The ability to ensure that workflows execute in a predictable manner.
For example workflows should provide:

-   Idempotent behavior for retries
-   Correct ordering of dependent tasks
-   Data consistency guarantees (e.g., eventual or strong consistency)


#### Usability {#usability}

The ability to define workflows in a way that is easy, understandable and maintainable
by users:
Clear and declarative workflow syntax or visual tools
Versioning and rollback support
Low-code or no-code options for business users

## The need for workflow engines {#the-need-for-workflow-engines}

This post makes clear what a workflow is and what are the functional and non-functional
aspects of a workflow. I hope it makes clear that implementing quality workflows is not a trivial task.

This is why we need workflow engines, systems that provide the necessary infrastructure to satisfy the
functional and non-functional requirements of workflows.

This is the first post of a series that will explore the world of workflow engines.
Stay tuned!
