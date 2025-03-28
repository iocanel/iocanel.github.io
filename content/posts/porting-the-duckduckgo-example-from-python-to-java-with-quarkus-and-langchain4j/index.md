+++
title = "Porting the DuckDuckGo example from Python to Java with Quarkus and Langchain4j"
author = ["Ioannis Canellos"]
date = 2025-02-14T00:00:00+02:00
draft = false
categories = ["development"]
tags = ["java", "quarkus", "langchain4j", "ai"] 
+++

## Intro {#intro}

A couple of weeks ago I came across [Roberto Carratalla](https://rcarrata.github.io/about/)'s blog post on [Function calling on OpenShift AI.](https://ai-on-openshift.io/odh-rhoai/enable-function-calling/)
At the time I was preparing for [RedHat Summit Connect Zurich 2025](https://www.redhat.com/en/summit/connect/emea/zurich-2024)  where I was meant to run a workshop on [Quarkus and Langchain4j](http://iocanel.com/rh-summit-connect-quarkus-langchain4j-workshop/) with
[Kyra Goud](https://www.linkedin.com/in/kyra-goud/), [Dimitris Andreadis](https://www.linkedin.com/in/dandreadis/) and [Codrin Bucur](https://www.linkedin.com/in/codrin/). We had an issue however, related to enabling functions on OpenShift AI.

Roberto pointed us to the blog post, but I couldn't spot what I was doing wrong. So, I decided to port the examples in the blog post to Java
to make sure that I was comparing apples to apples.

This post is a step by step guide on how to port the DuckDuckGo example from Python to Java with Quarkus and Langchain4j.

A video of me porting the example to Quarkus and Langchain4j can be found at: 

{{< youtube wewg9Waw8es >}}
[Porting the DuckDuckGo example from Python to Java with Quarkus and Langchain4j](https://www.youtube.com/watch?v=wewg9Waw8es).


## The original example {#the-original-example}

The original example is written in Python and it's pretty straightforward.


### Create the chat model {#create-the-chat-model}

It creates and configures an instance of a chat-based language model.

```python
# LLM definition
llm = ChatOpenAI(
    openai_api_key=API_KEY,
    openai_api_base= f"{INFERENCE_SERVER_URL}/v1",
    model_name=MODEL_NAME,
    top_p=0.92,
    temperature=0.01,
    max_tokens=512,
    presence_penalty=1.03,
    streaming=True,
    callbacks=[StreamingStdOutCallbackHandler()]
)
```


### Connect tools {#connect-tools}

It then creates a tool that delegates to the duckduckgo search library.

```python
from langchain_community.tools import DuckDuckGoSearchRun

llm_with_tools = llm.bind_tools([DuckDuckGoSearchRun], tool_choice="auto")
```


### Call the LLM {#call-the-llm}

Next stop is to actually prompt the user for a query and send it over to the LLM, letting it know what the available tools are.

```python
query = "Search what is the latest version of OpenShift?"
messages = [HumanMessage(query)]
ai_msg = llm_with_tools.invoke(messages)
print(ai_msg.tool_calls)
messages.append(ai_msg)
```


### Perform the actual calls {#perform-the-actual-calls}

Once we get the response from the LLM, we can perform the actual calls to the tools.

```python
for tool_call in ai_msg.tool_calls:
    selected_tool = {"duckduckgo_search": duckduckgo_search}[tool_call["name"].lower()]
    tool_msg = selected_tool.invoke(tool_call)
    messages.append(tool_msg)
```


### Pass the tool response back to the LLM {#pass-the-tool-response-back-to-the-llm}

Finally, we pass the tool response back to the LLM.

```python
llm_with_tools.invoke(messages)
```


## Porting the example to Quarkus and Langchain4j {#porting-the-example-to-quarkus-and-langchain4j}


### Create a client for DuckDuckGo {#create-a-client-for-duckduckgo}

The python example used the duckduckgo search tool from the langchain_community library. Not sure if there is a Java equivalent, I decided to create a client for DuckDuckGo using Rest Client Jackson.
I'll just need an \`interface\` that defines a search method that corresponds to an http get request to \`/q={query}&amp;format=json\`.

The \`@RegisterRestClient\` annotation is used to register the client with the Quarkus runtime. The \`configKey\` attribute is used to specify the configuration key that will be used to configure the client.
I can the set the URL of the DuckDuckGo API in the \`application.properties\` file, or alternatively pass it directly through the \`@RegisterRestClient\` annotation (via the \`baseUri\` attribute).

```java
package org.acme;

import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.MediaType;

@ApplicationScoped
@RegisterRestClient(configKey = "duckduckgo")
public interface SearchClient {

  @GET
  @Path("/q={query}&format=json")
  @Consumes(MediaType.APPLICATION_JSON)
  String search(String query);
}
```


### (Optional) Create a service that uses the client {#optional--create-a-service-that-uses-the-client}

I will wrap this in a service that will be used by the Langchain4j tool. I am doing this just to have a place to add logging or other control logic if needed.
I could have used the client directly in the tool.

```java
package org.acme;

import org.eclipse.microprofile.rest.client.inject.RestClient;

import dev.langchain4j.agent.tool.Tool;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class SearchService {

    @Inject
    @RestClient
    SearchClient searchClient;

    @Tool("Perform internet search using DuckDuckGo")
    public String search(String query) {
        Log.info("Search query: " + query);
        return searchClient.search(query);
    }
}
```


### Define the AI Service {#define-the-ai-service}

```java
package org.acme;

import io.quarkiverse.langchain4j.RegisterAiService;
import jakarta.enterprise.context.ApplicationScoped;

@RegisterAiService
@ApplicationScoped
public interface AiService {

    String search(String query);
}
```


### Call the Service from the CLI {#call-the-service-from-the-cli}

Last step is to create a CLI command for that reads the query from the user and calls the service.

```java
package org.acme;

import io.quarkus.picocli.runtime.annotations.TopCommand;
import jakarta.inject.Inject;
import picocli.CommandLine.Command;
import picocli.CommandLine.Parameters;

@TopCommand
@Command(name = "search", mixinStandardHelpOptions = true)
public class SearchCommand implements Runnable {

    @Parameters(index="0", description = "Your query.")
    String query;

    @Inject
    AiService searchService;

    @Override
    public void run() {
        System.out.printf("Search result: %s\n", searchService.search(query));
    }
```


## Thoughts {#thoughts}


### Imperative vs Declarative {#imperative-vs-declarative}

Despite the fact that Python is generally considered less verbose than Java, I find the Java version of the example to be more readable and easier to follow.
Of course, this is a matter of personal preference, but I find the declarative nature of the Quarkus example to be more appealing.

The Quarkus Langchain4j focuses more on that \`what\` rather than the \`how\`.

The biggest selling point in my opinion is that it makes the integration of tool completely transparent to the user. In other words, the user doesn't need to know
how to deal with tool call requests, how to pass the response back to the LLM etc. All of this is handled by the Quarkus Langchain4j framework.


### Rest Client with Langchain4j is a perfect match {#rest-client-with-langchain4j-is-a-perfect-match}

At first I went with the rest client out of necessity. When the example was complete, I relized that the result was almost magical.
I didn't have to implement client code for the DuckDuckGo API.
I didn't have to define domain objects for the response.
I definitely didn't have to parse the response.
And finally, I didn't have to worry how to pass the response back to the LLM.

All I needed to do was to define the \`contract\` for the client. Parsing the response, isolating the relevant parts and creating a human readable response was handled by LLM.

The best part is that the structure of the response can change at any time without breaking the implementation (provided of course that the path remains the same).


### Conclusion {#conclusion}

Python is an amazing language for data science and machine learning. However, nowadays with the rise of the LLMs, crafting smart applications is easily accessible to other languages too.
I often like to say that nowadays, building intelligent applications is an integration problem.
Quarkus and Langchain4j make this integration problem a breeze, as they allow you to focus on the \`what\` rather than the \`how\`.
Combined with the efficiency and performance characteristics of Quarkus, you get a winning combination.
