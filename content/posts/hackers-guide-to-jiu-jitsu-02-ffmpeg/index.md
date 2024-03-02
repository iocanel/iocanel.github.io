+++
title = "Hackers guide to Jiu Jitsu: ffmpeg"
author = ["Ioannis Canellos"]
description = "ffmpeg hacks for jiu jitsu instructionals"
date = 2021-08-11T23:20:00+03:00
draft = false
categories = ["hobbies"]
tags = ["jiu jitsu", "ffmpeg"]
+++

{{< figure src="hackers-guide-to-jiu-jitsu.png" >}}


## Intro {#intro}

I am a 40+ software engineer and recreational Jiu Jitsu practitioner, struggling with vast amount of information related to the sport.
I decided to make use of my \`computer\` skills to aid me in the process of taming this new skill.

This post is going to demonstrate how to use [ffmpeg](https://www.ffmpeg.org/) in order to:

-   Split long insturctions into logical chapters
-   Capture screenshots
-   Create animated gifs demonstrating techniques

This post will cover the fundamentals and will be the base for future posts that will demonstrate integrations with ohter tools.


## What is ffmpeg ? {#what-is-ffmpeg}

[ffmpeg](https://www.ffmpeg.org/) is tools for recording, manipulating and streaming videos. It's free &amp; opensource and available for most operationg systems.
In this post we are going to focus on the \`manipulating\` part.


## Why we need ffmpeg ? {#why-we-need-ffmpeg}

Jiu Jitsu instructionals are long. Even though they are usually split into pieces, each piece easily exceeds one hour in duration and looks more like a seminar rather than a lesson.
Personally, I find that in most cases it's really hard to digest more than 10-15 minutes in a single sitting. So, I'd like to split the videos even further, maybe per scene.

Also, I would like to embed parts of the instructional directly inside my notes. For example, in the section where I have my notes on \`Juji Gatame\` I'd like to have an animated gif demonstrating the technique.
In more rare cases, a single screenshot form the video would sufice (e.g. to demonstrate hand placement in various techniques).


## Installing ffmpeg {#installing-ffmpeg}

This section describes how to install it based on your operating system.


### Linux {#linux}

If you are using linux chances are that you don't really need me to tell you how to install it.


#### Fedora {#fedora}

```sh
  sudo dnf -y install ffmpeg
```


#### Ubuntu {#ubuntu}

```sh
  sudo apt-get install ffmpeg
```


### OSX {#osx}

```sh
  brew install ffmpeg
```


### Windows {#windows}

Windows users will have to install and get familiar with [wsl](https://docs.microsoft.com/en-us/windows/wsl/install-win10), first.
Then:

```sh
  sudo apt-get install ffmpeg
```

From now on all command we provide will need to go via [wsl](https://docs.microsoft.com/en-us/windows/wsl/install-win10) unless explicitly specified.


## Detecting chapters {#detecting-chapters}

To make long instructionals more usable:

-   easier to search
-   split in digestable chunks

we will have to split them.

Luckily, most of them contain multiple scenes each starting with a title screen, like the ones shown below:

{{< figure src="titles-screens.png" >}}

This makes it possible to use [ffmpeg](https://www.ffmpeg.org/) in order to detect scenes. The idea is to detect frames that have noticable differences than the previous one.

This can be done using a command like:

```sh
  ffprobe -show_frames -of compact=p=0 -f lavfi "movie=instructional.mkv,select=gt(scene\,0.8)" | awk -F "|" '{print $7}' | cut -f2 -d"="
```

The command above does the following:

-   collect frames that have 80% difference in pixels from the previous one (you can play around with this value
-   grab the value of the 7th column of the output that contains the timestamp
-   keep only the numeric value

The result will be the timestamps in seconds of each different scene.

There are many things you can do with this timestamp. Below are some examples:


### Spliting the video by chapter {#spliting-the-video-by-chapter}

The script below will attempt to detect chapters and split the long video accordingly.

<a id="code-snippet--split-video-by-chapter.sh"></a>
```sh
  #!/bin/bash
  VIDEO=$1
  EXTENSION="${VIDEO##*.}"
  FRAMERATE=5
  SCALE="512:-1"
  begin="00:00:00"
  scene=1

  # For each timestamp:
  ffprobe -show_frames -of compact=p=0 -f lavfi "movie=$1,select=gt(scene\,0.8)" 2> /dev/null | awk -F "|" '{print $7}' | cut -f2 -d"=" | while read timestamp; do

      #Keep the integer part of the timestamp
      ts=`echo $timestamp | cut -d"." -f1`

      #Convert timestamp to time using the HH:mm:ss format
      hours=`expr $ts / 3600`
      if [ $hours -lt 10 ]; then
          hours="0$hours"
      fi
      minutes=`expr $ts % 3600 / 60`
      if [ $minutes -lt 10 ]; then
          minutes="0$minutes"
      fi
      seconds=`expr $ts % 60`
      if [ $seconds -lt 10 ]; then
          seconds="0$seconds"
      fi
      end="$hours:$minutes:$seconds"

      # Perform the split
      ffmpeg -y -i $1 -ss $begin -to $end scene-$scene.$EXTENSION < /dev/null 2> /dev/null
      begin="$hours:$minutes:$seconds"
      let scene=$scene+1
  done
```

If the script isn't accurate enough, you may need to tinker the pixel percentage.


### Creating animated gifs {#creating-animated-gifs}

Even if splitting a large video into smaller chunks, those chunks won't be small enough.
Sometimes, you just need to get a glimpse of a technique in order to remember what it is about.
It often helps using and embedding animated images direcly inside your notes (assuming they are in a digital format).

Here's an example an animated image that is demonstrating the \`pumping method\` for breaking grips:

{{< figure src="The pumping method grip break.gif" >}}

<a id="code-snippet--creaate-animated.gif.sh"></a>
```sh
  #!/bin/bash
  VIDEO=$1
  BEGINNING=${2:-"00:00:00"}
  END=${3:-"00:01:00"}
  FRAMERATE=${4:-5}
  SCALE=${5:-"512:-1"}

  NAME="${VIDEO%.*}"
  EXTENSION="${VIDEO##*.}"

  ffmpeg -y -i "$VIDEO" -r $FRAMERATE -vf scale=$SCALE -ss $BEGINNING -to $END $NAME.gif < /dev/null 2> /dev/null
  done
```

The script can then be invoked like:

```sh
  create-animated-gif.sh <your vide here> <beginning HH:mm:ss> <end HH:mm:ss>
```

The challenge here is to spot and keep track of the beginning and end times. In future posts I am going to provide tips on how to simplify that as much as possible.


## Extracting a single frame as an image. {#extracting-a-single-frame-as-an-image-dot}

Sometimes you just want to extract a single image instead of an animated gif. This can be especially useful if you intend to print your notes on paper.

```sh
  ffmpeg -i <your video here> -ss <timestamp in HH:mm:ss> -vframes 1 screenshot.png < /dev/null 2> /dev/null
```


## Post index {#post-index}

-   01. Hackers guide to Jiu Jitsu: intro [wordpress version](https://iocanel.com/2021/08/hackers-guide-to-jiu-jitsu) [github version](https://github.com/iocanel/blog/tree/master/hackers-guide-to-jiu-jitsu-01-intro)
-   02. Hackers guide to Jiu Jitsu: ffmpeg [wordpress version](https://iocanel.com/2021/08/hackers-guide-to-jiu-jitsu-ffmpeg) [github version](https://github.com/iocanel/blog/tree/master/hackers-guide-to-jiu-jitsu-02-ffmpeg)
-   03. Hackers guide to Jiu Jitsu: mplayer [wordpress version](https://iocanel.com/2021/08/hackers-guide-to-jiu-jitsu-mplayer) [github version](https://github.com/iocanel/blog/tree/master/hackers-guide-to-jiu-jitsu-03-mplayer)
-   04. Hackers guide to Jiu Jitsu: markdown wiki [wordpress version](https://iocanel.com/2021/08/hackers-guide-to-jiu-jitsu-markdown-wiki) [github version](https://github.com/iocanel/blog/tree/master/hackers-guide-to-jiu-jitsu-04-markdown-wiki)
-   05. Hackers guide to Jiu Jitsu: flowcharts [wordpress version](https://iocanel.com/2022/01/hackers-guide-to-jiu-jitsu-flowcharts) [github version](https://github.com/iocanel/blog/tree/master/hackers-guide-to-jiu-jitsu-05-flowcharts)
