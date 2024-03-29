+++
title = "Hackers guide to Jiu Jitsu: Flowcharts"
author = ["Ioannis Canellos"]
description = "Tools for creating flowcharts for your bjj instructionals and notes"
date = 2022-01-11T23:56:00+02:00
draft = false
categories = ["hobbies"]
+++

{{< figure src="./hackers-guide-to-jiu-jitsu.png" >}}


## Intro {#intro}

I am a 40+ software engineer and recreational Jiu Jitsu practitioner, struggling with vast amount of information related to the sport.
I decided to make use of my \`computer\` skills to aid me in the process of taming this new skill.

In this post I am going to discuss about flowcharts and more specifically about:

-   why bother with flowcharts
-   tools for creating flowcharts
-   integrating flowcharts with with wiki


## What is a flowchart ? {#what-is-a-flowchart}

A flowchart is a diagram of the sequences of movements or actions of people or things involved in a complex system or activity.

In the sport of Jiu Jitsu the \`activity\` may be a technique or a series of techniques one needs to perform to either submit the oppoent or to get into an advantageous position.
In other words a flowchart a graphical representation of the steps that constitue one or more techniques.


## Why use flowcharts ? {#why-use-flowcharts}

Visualization helps the process of learning and also helps the brain retain information. No wonder why people who exibit impressive memory skills often use visualization based
techniques like the \`Memory Palace\` etc.

For material that is already known, using flowcharts really helps refreshing ones memory, as it's much faster than going through the original material.
It's also something that one can easily print, add notes on top of it and so on.

For new material, creating flowcharts assists comprehension and reinforces learning.

Last but not least, flowcharts can act as an index that can help you to easily navigate to a \`step\` of interest.


## Flowcharting tools {#flowcharting-tools}

There are tons of flowcharting tools out there. I am interested only in tools that define a domain specific language mostly because we can use scripts to generate them (or parts of them).
WYSIWYG (what you see is what you get) tools might be more appealing to some users, but apparently these people are not my target audience.

Other qualities of a flowcharting tool includes:

-   ease of use
    -   verbosity
    -   quality of feedback (error messages)
-   integrations
    -   editor support
    -   web / wiki support

This post is going to focus on three of the most popular choices out there:

-   [PlantUML](https://plantuml.com/)
-   [yuml](https://yuml.me/)
-   [flowchart.js](https://flowchart.js.org/)


### PlantUML {#plantuml}

[PlantUML](https://plantuml.com/) is a component that allows users to easily create UML diagrams.
UML is a modeling language used in software engineering and one of the diagrams it uses is the activity diagram,
which is pretty much a flowchart.

[PlantUML](https://plantuml.com/) uses a client/server architecture, so it usually requires internet access. Usually? Well, it allows you
to run the servre locally too (without much hussle).

The tool has integration with tons of tools and services and is generally a solid choice.

Here's an example diagram for closed guard:

```text
  @startuml
  start
  repeat
    :closed guard;
  switch ( opponents posture )
    case ( straight )
      if (hip bump) then (yes)
        :Mount;
        end
      else if (kimura) then (yes)
        :Submission;
        end
      else if (guillotine) then (yes)
        :Submission;
        end
      endif
    case ( balanced )
      fork
    :Kuzushi with knees;
    :Two on one arm drag;
      end merge
    case ( forward )
      if (Underhook) then (yes)
        :Grab armpit / lapel;
        :Bring opposite knee to the floor;
        :Free hip;
        :Take the back;
        end
      else if (Overhook) then (yes)
      endif

  endswitch
  repeat while (check posture)
  end
  @enduml
```

\#+RESULTS
![](plantuml-closed-guard-diagram.png)

I have been using [PlantUML](https://plantuml.com/) a lot for creating BJJ related flowcharts and my only complaint is its verbosity.
Especially, for non-developers it might seem a bit too much.


#### yuml {#yuml}

[yuml](https://yuml.me/) is pretty similar to [PlantUML](https://plantuml.com/) with less verbose syntax. In fact, it completely lacks keywords and only uses symbols.
So, in a sense it feels like creating the diagram in ascii.
It's also supported out of the box in [mdwiki](http://dynalon.github.io/mdwiki/) using [mdwiki gimmicks](http://dynalon.github.io/mdwiki/#!gimmicks.md%23UML_Diagrams_via_yUML.me).

It also reqires internet access as the rendering happens by their online server.
One downside compared to the competition is that I didn't find a way to include clickable parts inside the generated graph.
This seems to be an option in the other two tools.

```text
(start)-(closed guard)->(check posture)-><p>
<p>[straigt]->(hip bump)-><h>
<h>[yes]->(mount)
<h>[no]->(kimura)-><k>
<k>[yes]->(submission)
<k>[no]->(guillotine)-><g>
<g>[yes]->(submission)
<g>[no]->(check posture)
(mount)->(end)
(submission)->(end)
<p>[balanced]->(kuzushi with knees)->(two on one arm drag)->(check posture)
<p>[forward]->(underhook)-><u>
<u>[yes]->(grab armpit / lapel)->(bring knee to the floor)->(free hip)->(take the back)
(take the back)->(end)
<u>[no]->(overhook)->(check posture)
```

![](yuml-closed-guard-diagram.png)
Much simpler to write, but the diagram itself does not look as tidy as the previous one.


#### Flowchart JS {#flowchart-js}

The last contender is [flowchart.js](https://flowchart.js.org/). This project focuses exclusively on flowcharts instead of UML (as was the case for the previous tools).

Syntax wise is similar to [yuml](https://yuml.me/), however, it does require you addtionally define the type and content of each node in the graph.

```text
 st=>start: Start
 cg=>operation: Closed guard
 cp=>operation: Check opponent's posture
 straight=>condition: Straight
 balanced=>condition: Balanced
 forward=>condition: Forward
 uhook=>condition: Underhook
 hb=>condition: Hip bump
 kmr=>condition: Kimura
 glt=>condition: Guillotine
 kzk=>operation: Kuzushi with knees
 toodrag=>operation: Two on one arm drag
 grabl=>operation: Grab lapel
 kneedown=>operation: Bring opposite knee to the floor
 hipe=>operation: Hip escape
 tbak=>end: Take the back
 sub=>operation: Submission
 etc=>end: etc
 restart=>end: Restart
 e=>end: End

 st->cg->cp
 cp->straight
 straight(yes)->hb
 straight(no)->balanced
 hb(yes)->sub
 hb(no)->kmr
 kmr(yes)->sub
 kmr(no)->glt
 glt(yes)->sub
 glt(no)->cp

 balanced(yes)->kzk->toodrag->restart
 balanced(no)->forward

 forward(yes)->uhook
 forward(no)->restart

 uhook(yes)->grabl->kneedown->hipe->tbak
 uhook(no)->restart

 sub->e
```

{{< figure src="flowchartjs-closed-guard-diagram.png" >}}

A benefit compared to the above is that it seems to work completely offline.
Also, the for the generated graph has a professional quality.

The downside is that syntactical errors are pretty hard to diagnose and some times the way the graph is rendered is weird.


### Using flowcharts in your wiki {#using-flowcharts-in-your-wiki}

[mdwiki](http://dynalon.github.io/mdwiki/) supports extensions called gimmicks which are special markdown elements that provide rich functionality.
One such gimmick is  [yuml](https://yuml.me/). The code below when added to your wiki will be rendered as a diagram:

```text
[gimmick:yuml]( [HttpContext]uses -.->[Response] )
```

I implemented equivallent gimmicks for both [PlantUML](https://plantuml.com/) and [flowchart.js](https://flowchart.js.org/) and they can be found in my [mdwiki](http://dynalon.github.io/mdwiki/) Docker image \`iocanel/mdwiki:2022.01\` or just \`iocanel/mdwiki:latest\`.
If you don't want to use it via docker, then just grab my \`index.html\` and \`lib\` folders from:  <https://github.com/iocanel/dockerfiles/tree/master/net/mdwiki>.

These custom gimmicks however, istead of accepting the code \`inline\` the accept it as a file. So you just place the file with diagram code inside your wiki and then use:

```text
[gimmick:plantuml]( diagram-filename )
```

and for flowchart.js:

```text
[gimmick:flowchartjs]( diagram-filename )
```


## Post index {#post-index}

-   01. Hackers guide to Jiu Jitsu: intro [wordpress version](https://iocanel.com/2021/08/hackers-guide-to-jiu-jitsu) [github version](https://github.com/iocanel/blog/tree/master/hackers-guide-to-jiu-jitsu-01-intro)
-   02. Hackers guide to Jiu Jitsu: ffmpeg [wordpress version](https://iocanel.com/2021/08/hackers-guide-to-jiu-jitsu-ffmpeg) [github version](https://github.com/iocanel/blog/tree/master/hackers-guide-to-jiu-jitsu-02-ffmpeg)
-   03. Hackers guide to Jiu Jitsu: mplayer [wordpress version](https://iocanel.com/2021/08/hackers-guide-to-jiu-jitsu-mplayer) [github version](https://github.com/iocanel/blog/tree/master/hackers-guide-to-jiu-jitsu-03-mplayer)
-   04. Hackers guide to Jiu Jitsu: markdown wiki [wordpress version](https://iocanel.com/2021/08/hackers-guide-to-jiu-jitsu-markdown-wiki) [github version](https://github.com/iocanel/blog/tree/master/hackers-guide-to-jiu-jitsu-04-markdown-wiki)
-   05. Hackers guide to Jiu Jitsu: flowcharts [wordpress version](https://iocanel.com/2022/01/hackers-guide-to-jiu-jitsu-flowcharts) [github version](https://github.com/iocanel/blog/tree/master/hackers-guide-to-jiu-jitsu-05-flowcharts)
