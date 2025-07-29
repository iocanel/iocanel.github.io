+++
title = "Workflows everywhere pt. 2"
author = ["Ioannis Canellos"]
date = 2025-07-29
draft = false
+++

## Introduction {#introduction}

In my previous post [Workflows everywhere pt. 1](https://iocanel.com/2025/07/workflows-everywhere-pt.-1/) I tried to define [workflows](https://en.wikipedia.org/wiki/Workflow) and enumerate their
functional and non-functional requirements. The post concluded with the realization that in many
case we need workflow engines to power our workflows.

This post defines what a workflow engine is and lists some of the most popular engines by category.
Or at least that was the original intention, but there is a twist.


## What Is a Workflow Engine? {#what-is-a-workflow-engine}

Workflow engines are systems designed to simplify the creation and execution of workflows.
They orchestrate the flow of information between the activities that compose the workflow based
on predefined logic, conditions and dependencies.

Simply put they are systems that allow users to easily design workflows then take care of executing
each activity / step of the workflow passing data between them.


## Workflow engine categorization {#workflow-engine-categorization}

This is the part where this posts gets interesting, as there is no single way to categorize workflow engines.
One could categorize engines by purpose. Others may be more interested in the architecture characteristics of the engine.
Operational is also an interesting way to categorize engines and let's not forget about the costs and licensing of the engine.

For example a teleological categorization (purpose based) could introduce categories like:

-   Business Process Management (BPM) engines
    -   [Camunda (Zeebe)](https://camunda.com)
    -   [Flowable](https://flowable.com)
-   Data Processing engines
    -   [Apache Airflow](https://airflow.apache.org)
    -   [Luigi](https://github.com/spotify/luigi)
-   Machine Learning (ML) engines
    -   [Kubeflow Pipelines](https://www.kubeflow.org/docs/components/pipelines/)
-   Microservices orchestration engines
    -   [Temporal](https://temporal.io)
    -   [Camunda (Zeebe)](https://camunda.com)
-   CI/CD engines
    -   [Tekton](https://tekton.dev)
    -   [Argo Workflows](https://argoproj.github.io/workflows)

While an architectural categorization could introduce categories like:

-   Log based engines
    -   [Temporal](https://temporal.io)
    -   [Camunda (Zeebe)](https://camunda.com)
-   State machine based engines
    -   [Flowable](https://flowable.com)
    -   [Activiti](https://www.activiti.org)
-   DAG based engines
    -   [Apache Airflow](https://airflow.apache.org)
    -   [Dagster](https://dagster.io)
-   Code flows
    -   [Apache Camel](https://camel.apache.org)

Given the large number of workflow engines available today, it is not practical to list them all statically using different categorizations.
What would be more practical is to use an interactive approach for exploring multidimensional categorizations of workflow engines. Additionally,
it would be useful if it was something that could be easily updated as new engines are released or existing ones evolve.


## An interactive Workflow Engine explorer {#an-interactive-workflow-engine-explorer}

I begun to entertain the idea of creating an interactive web application that would help me experiment and visualize different categorizations.
As soon as I got the first draft it was pretty clear to me that this is something that could be useful to others as well.

{{< figure src="screenshot.png" >}}

To try it out, at: <https://iocanel.com/workflow-engines>.
The actual code for the application can be found at: <https://github.com/iocanel/workflow-engines>

I expect the content of the application to evolve over time, as new engines are released or existing ones evolve.
The categorization is likely to change as well, let's collaborate and keep it up to date!


## Next steps {#next-steps}

I intend to start visiting some of the engines listed in the application and write more detailed posts about them.
Most likely, I will start with the ones that I have not used in the past or maybe the ones that I could connect to
my day job, but I am open to suggestions.
