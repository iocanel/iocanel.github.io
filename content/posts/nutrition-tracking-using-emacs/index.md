+++
title = "Nutrition tracking using Emacs"
author = ["Ioannis Canellos"]
date = 2020-04-03T18:39:00+03:00
draft = false
+++

This is not a blog post. This is my Emacs powered nutrition tracker!

No, I mean it!

It's the one file that contains all the code, templates and data of my tracker,
exported in html.

Keep reading, to see how you can harness the power of emacs and org mode to track your nutrition
and even generate cool graphs like:

{{< figure src="nutrition-table.png" >}}

For quick demo you can check this short [Youtube demo: Nutrition tracking using Emacs](https://www.youtube.com/watch?v=GAhBFFLBJww).

The post is available in 3 formats.

-   [My Wordpress Blog](https://iocanel.com/2020/04/nutrition-tracking-using-emacs-and-org/) (wordress sucks at rendering lisp, so the other formats are preferred)
-   [My Github Blog](https://github.com/iocanel/blog/tree/master/nutrition-tracking-using-emacs)
-   [Gist](https://gist.github.com/iocanel/0b8bcdb3d69fb7731069cb872f836507)

All 3 formats are powered by a single org file called \`nutrition.org\`.

Feel free to grab
that file, save it in your computer and add the following line to your emacs
configuration:

```text
(org-babel-load-file "/path/to/nutrition.org")
```


## The idea {#the-idea}

Traditional nutrition tracking applications don't work for me. I find it really
hard to select the foods I ate from paginated, lists of checkboxes (... even saying
it out loud feels like cursing). Same goes to
defining recipes.

What these apps do really well is looking up base nutrient value, which is
something you only need to do once per food. For capturing meals (i.e. daily use) they suck!

On the other hand, using org-mode for capturing stuff (TODOs, ideas, notes), is really awesome!

So, I decided to create 3 lists:

-   [Foods](#foods)
-   [Recipes](#recipes)
-   [1](#table--Meals)

These lists will hold, individual nutrient values per food, per recipe and per day.
The data will be captured in org mode tables (think of text file spreadsheets).

Finally, the data will be aggregated into a table holding daily nutrition stats
and a graph will be created from this table.


## Setup {#setup}

The whole setup is based on org-mode. This is a single org file that contains
everything:

-   docs
-   templates
-   code
-   config
-   data


### Requirements {#requirements}

To be able to sucesully use the templates and code provided you will need to have \`org-ql\` installed in your system.

```emacs-lisp
   (use-package org-ql)
```

Additionally, you will need the following custom code:

```emacs-lisp
   (defun iocanel/org-heading (heading tags)
  "Format the HEADING and the TAGS in the desired way."
  (format "%-80s %s" heading tags))

(defun iocanel/org-trim-tags (h)
  "Removes all tags that are present in H."
  (if h (string-trim  (replace-regexp-in-string ":[a-zA-Z0-9_\\.-:]+:$" "" h)) nil))

(defun iocanel/org-get-entries (tag &optional f)
  (interactive)
  "Collects all headings that contain TAG from the current buffer or from file F."
  (if f (mapcar #'iocanel/org-trim-tags (org-map-entries #'org-get-heading tag 'file))
    (mapcar #'iocanel/org-trim-tags (org-map-entries #'org-get-heading tag 'agenda))))

(defun iocanel/org-get-property (file name tag property)
  "Extract the PROPERTY for NAME tagged with TAG in org FILE."
  (cdr (assoc property (car (org-ql-query
                             :select #'org-entry-properties
                             :from file
                             :where `(and (tags ,tag)
                                          (equal ,name (org-get-heading t t))))))))
```


### Templates {#templates}

This section contains the templates used. These are [org-mode capture templates](https://orgmode.org/manual/Capture-templates.html).
The templates follow these [expansion rules](https://orgmode.org/manual/Template-expansion.html#Template-expansion).


#### Food template {#food-template}

We need to hold nutrient values per food. So, we are going to use a table per
food with these value. So, for each food we have an org item that contains the table.
The structure of the such a list item is shown below:

```cfg
      * %^{Food Name} :nutrition:food:
      :PROPERTIES:
      :UNIT: %^{Unit|gram|ml|slice|pcs|tspn|spn}
      :QUANTITY: %^{Quantity}
      :WEIGHT: %^{Weight in grams}
      :CALORIES: %^{Calories}
      :PROTEIN: %^{Protein}
      :CARBS: %^{Carbs}
      :FAT: %^{Fat}
      :END:
      %?
      #+TBLNAME: %\1
      |   | INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
      |---+------------+---------+----------+----------+---------+-------+-----|
      | # | %\1        |       1 |      %\4 |      %\5 |     %\6 |   %\7 | %\8 |

```


#### Recipe template {#recipe-template}

We need the same for recipes. The only difference is that a recipe may contain
multiple foods as ingredients. So, we have row per food.

```cfg
      * %^{Recipe Name} :nutrition:recipe:
      :PROPERTIES:
      :MAIN_INGRIDIENT: %^{Food|%(string-join (iocanel/org-get-entries "+food") "|")}
      :SECOND_INGRIDIENT: %^{Food|None|%(string-join (iocanel/org-get-entries "+food") "|")}
      :THIRD_INGREDIENT: %^{Food|None|%(string-join (iocanel/org-get-entries "+food") "|")}
      :FOURTH_INGREDIENT: %^{Food|None|%(string-join (iocanel/org-get-entries "+food") "|")}
      :END:

      #+TBLNAME: %\1
      |   | INGREDIENT | SERVING  | QUANTITY | CALORIES | PROTEIN | CARBS  | FAT |
      |---+------------+----------+----------+----------+---------+--------+-----|
      | # | %\2        |        1 |          |          |         |        |     |
      | # | %\3        |        1 |          |          |         |        |     |
      | # | %\4        |        1 |          |          |         |        |     |
      | # | %\5        |        1 |          |          |         |        |     |
      |---+------------+----------+----------+----------+---------+--------+-----|
      | # | Total      |          |          |          |         |        |     |
      #+TBLFM: $4='(iocanel/get-recipe-property $2 $3 "QUANTITY")::$5='(iocanel/get-recipe-property $2 $3 "CALORIES")::$6='(iocanel/get-recipe-property $2 $3 "PROTEIN")::$7='(iocanel/get-recipe-property $2 $3 "CARBS")::$8='(iocanel/get-recipe-property $2 $3 "FAT")::@>$4=vsum(@I..@II)::@>$5=vsum(@I..@II)::@>$6=vsum(@I..@II)::@>$7=vsum(@I..@II)::@>$8=vsum(@I..@II)
```


#### Meals template {#meals-template}

Each recipe or recipe that is logged by this tracker goes to a table as a new row.
The template of the row is:

```cfg
      | # | %(org-insert-time-stamp (org-read-date nil t nil)) |  %^{Recipe|%(string-join (iocanel/org-get-entries "+recipe|+food") "|")} | %^{Serving|1|2|3|4|5} | | | | | |
```


### Functions {#functions}

We just need a function that we can use and read the nutrient values from the tables.

The function will get as arguments the name of the food, the quantity and the
attribute we need to lookup and will return the result.

```emacs-lisp
     (defun iocanel/org-heading (heading tags)
       "Format the HEADING and the TAGS in the desired way."
       (format "%-80s %s" heading tags))


     (defun iocanel/org-trim-tags (h)
       "Removes all tags that are present in H."
       (if h (string-trim  (replace-regexp-in-string ":[a-zA-Z0-9_\\.-:]+:$" "" h)) nil))

     (defun iocanel/org-get-entries (tag &optional f)
       (interactive)
       "Collects all headings that contain TAG from the current buffer or from file F."
       (if f (mapcar #'iocanel/org-trim-tags (org-map-entries #'org-get-heading tag 'file))
         (mapcar #'iocanel/org-trim-tags (org-map-entries #'org-get-heading tag 'agenda))))

     (defun iocanel/org-get-property (file name tag property)
       "Extract the PROPERTY for NAME tagged with TAG in org FILE."
       (cdr (assoc property (car (org-ql-query
                                  :select #'org-entry-properties
                                  :from file
                                  :where `(and (tags ,tag)
                                               (equal ,name (org-get-heading t t))))))))


     (defvar nutrition-recipe-column-alsit '(("QUANTITY" . 4)
                                             ("CALORIES" . 5)
                                             ("PROTEIN" . 6)
                                             ("CARBS" . 7)
                                             ("FAT" . 8)))

     (defun iocanel/get-recipe-property (recipe &optional quantity prop)
       "Return the sum of the COLUMN for the specified RECIPE and QUANTITY. If QUANTITY is omitted 1 (gram) is assumed."
       (let* ((prop (or prop "CALORIES"))
              (quantity (if (numberp quantity) quantity (string-to-number (format "%s" quantity))))
              (col (cdr (assoc prop nutrition-recipe-column-alsit)))
              (val (substring-no-properties (org-table-get-remote-range recipe (format "@>$%s" col)))))
         (cond
          ((not val) 0)
          ((numberp val) (ceiling (* quantity val)))
          ((stringp val) (ceiling (* quantity (string-to-number val)))))))

```


### Configuration {#configuration}

For this setup to we work we need to configure org-catpure.

```emacs-lisp
     (setq org-capture-templates (append org-capture-templates '(
                                                                 ("n" "Nutrition")
                                                                 ("nf" "Foods" entry (file+olp "~/Documents/org/nutrition.org" "Foods")(file "~/Documents/org/templates/nutrition-food.orgtmpl"))
                                                                 ("nr" "Recipes" entry (file+olp "~/Documents/org/nutrition.org" "Recipes")(file "~/Documents/org/templates/nutrition-recipe.orgtmpl"))
                                                                 ("nm" "Meals" table-line (file+olp "~/Documents/org/nutrition.org" "Meals")(file "~/Documents/org/templates/nutrition-meals.orgtmpl")))))

```


## Foods {#foods}

To add a new food call \`org-capture\` and then type \`nf\`.

For each captured food we are storing the following properties:

-   ****UNIT****: Refers to how we usually measure the particular food. For example 1
    slice of turkey.
-   ****QUANTITY****: Is the unit multiplier that provides the captured nutrients.
-   ****WEIGHT****: The weight in grams of \`unit x quantity\`.


### None <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#none}

We just use this entry for in multiple choices.

<a id="table--None"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| None | 1 | 0 | 0 | 0 | 0 | 0 |


### Egg <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#egg}

<a id="table--Egg"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Egg | 1 | 63 | 98 | 8 | 1 | 7 |


### Turkey <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span><span class="whitemeat">whitemeat</span></span> {#turkey}

<a id="table--Turkey"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Turkey | 1 | 30 | 21 | 4 | 0 | 0 |


### Toast cheese / Milner light <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span><span class="dairy">dairy</span></span> {#toast-cheese-milner-light}

<a id="table--Toast cheese - Milner light"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Toast cheese / Milner light | 1 | 30 | 48 | 7 | 4 | 3 |


### Tortilla / El Sabor <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#tortilla-el-sabor}

<a id="table--Tortilla - El Sabor"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Tortilla / El Sabor | 1 | 60 | 188 | 5 | 28 | 6 |


### Olive oil <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span><span class="fat">fat</span></span> {#olive-oil}

<a id="table--Olive oil"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Olive oil | 1 | 10 | 82 | 1 | 1 | 9 |


### Avocado <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span><span class="fruit">fruit</span></span> {#avocado}

<a id="table--Avocado"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Avocado | 1 | 70 | 187 | 2 | 11 | 18 |


### Honey / Αττική <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#honey-αττική}

<a id="table--Honey - Αττική"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Honey / Αττική | 1 | 10 | 34 | 0 | 8 | 0 |


### Banana / Medium <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span><span class="fruit">fruit</span></span> {#banana-medium}

<a id="table--Banana - Medium"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Banana / Medium | 1 | 63 | 98 | 8 | 1 | 7 |


### Peanutbutter <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#peanutbutter}

<a id="table--Peanutbutter"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Peanutbutter | 1 | 10 | 56 | 3 | 1 | 4 |


### Walnuts <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span><span class="nuts">nuts</span></span> {#walnuts}

<a id="table--Walnuts"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Walnuts | 1 | 24 | 157 | 4 | 3 | 16 |


### Chicken breast <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span><span class="whitemeat">whitemeat</span></span> {#chicken-breast}

<a id="table--Chicken breast"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Chicken breast | 1 | 120 | 170 | 32 | 4 | 0 |


### Quinoa / Red <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#quinoa-red}

<a id="table--Quinoa - Red"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Quinoa / Red | 1 | 190 | 669 | 27 | 108 | 12 |


### Spaghetti / Whole grain <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#spaghetti-whole-grain}

<a id="table--Spaghetti - Whole grain"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Spaghetti / Whole grain | 1 | 210 | 736 | 27 | 138 | 5 |


### Ground meat / Beef <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span><span class="redmeat">redmeat</span></span> {#ground-meat-beef}

<a id="table--Ground meat - Beef"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Ground meat / Beef | 1 | 90 | 193 | 24 | 0 | 10 |


### Potato <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span><span class="starch">starch</span></span> {#potato}

<a id="table--Potato"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Potato | 1 | 225 | 193 | 4 | 45 | 0 |


### Lettuce <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span><span class="vegtable">vegtable</span></span> {#lettuce}

<a id="table--Lettuce"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Lettuce | 1 | 180 | 25 | 3 | 5 | 0 |


### Bread / Whole grain <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#bread-whole-grain}

<a id="table--Bread - Whole grain"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Bread / Whole grain | 1 | 30 | 65 | 3 | 13 | 1 |


### Yogurt / Light 2 percent <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span><span class="dairy">dairy</span></span> {#yogurt-light-2-percent}

<a id="table--Yogurt - Light 2 percent"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Yogurt / Light 2 percent | 1 | 200 | 142 | 16 | 11 | 4 |


### Rusk / Manna <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#rusk-manna}

<a id="table--Rusk - Manna"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Rusk / Manna | 1 | 30 | 124 | 4 | 22 | 3 |


### Oat burgers <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span><span class="redmeat">redmeat</span></span> {#oat-burgers}

<a id="table--Oat burgers"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Oat burgers | 1 | 120 | 226 | 17 | 17 | 4 |


### Seam beam <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span><span class="fish">fish</span></span> {#seam-beam}

<a id="table--Seam beam"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Seam beam | 1 | 200 | 367 | 47 | 0 | 20 |


### Milk / Full fat <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span><span class="dairy">dairy</span></span> {#milk-full-fat}

<a id="table--Milk - Full fat"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Milk / Full fat | 1 | 140 | 91 | 5 | 7 | 6 |


### Broccoli <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span><span class="vegtable">vegtable</span></span> {#broccoli}

<a id="table--Broccoli"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Broccoli | 1 | 100 | 45 | 4 | 8 | 1 |


### Spinach <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span><span class="vegtable">vegtable</span></span> {#spinach}

<a id="table--Walnuts"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Walnuts | 1 | 24 | 157 | 4 | 3 | 16 |


### Rucola <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span><span class="vegtable">vegtable</span></span> {#rucola}

<a id="table--Rucola"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Rucola | 1 | 100 | 25 | 3 | 4 | 1 |


### Cottage Cheese / Light 4% <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span><span class="dairy">dairy</span></span> {#cottage-cheese-light-4}

<a id="table--Cottage Cheese - Light 4%"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Cottage Cheese / Light 4% | 1 | 100 | 92 | 11 | 3 | 4 |


### Sesame paste <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#sesame-paste}

<a id="table--Sesame paste"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Sesame paste | 1 | 10 | 63 | 3 | 1 | 6 |


### Cabbage <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span><span class="vegtable">vegtable</span></span> {#cabbage}

<a id="table--Cabbage"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Cabbage | 1 | 24 | 157 | 4 | 3 | 16 |


### Tomato <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span><span class="vegtable">vegtable</span></span> {#tomato}

<a id="table--Tomato"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Tomato | 1 | 200 | 36 | 2 | 8 | 0 |


### Levantina fish <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span><span class="fish">fish</span></span> {#levantina-fish}

<a id="table--Walnuts"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Walnuts | 1 | 24 | 157 | 4 | 3 | 16 |


### Raisins <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span><span class="fruit">fruit</span></span> {#raisins}

<a id="table--Raisins"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Raisins | 1 | 10 | 28 | 0 | 23 | 0 |


### Dried Blueberries <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span><span class="fruit">fruit</span></span> {#dried-blueberries}

<a id="table--Dried Blueberries"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Dried Blueberries | 1 | 10 | 35 | 0 | 9 | 0 |


### Dried Cranberries <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span><span class="fruit">fruit</span></span> {#dried-cranberries}

<a id="table--Dried Cranberries"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Dried Cranberries | 1 | 10 | 35 | 0 | 8 | 0 |


### Honey with Hazelnut paste <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#honey-with-hazelnut-paste}

<a id="table--Honey with Hazelnut paste"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Honey with Hazelnut paste | 1 | 10 | 61 | 1 | 10 | 2 |


### Honey with Peanut paste <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#honey-with-peanut-paste}

<a id="table--Honey with Peanut paste"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Honey with Peanut paste | 1 | 10 | 61 | 1 | 10 | 2 |


### Tomato sauce / Kyknos <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#tomato-sauce-kyknos}

<a id="table--Tomato sauce - Kyknos"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Tomato sauce / Kyknos | 1 | 40 | 18 | 0 | 3 | 3 |


### Philadelphia cheese / light <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#philadelphia-cheese-light}

<a id="table--Philadelphia cheese - light"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Philadelphia cheese / light | 1 | 24 | 157 | 4 | 3 | 16 |


### Toast bread / Whole grain <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#toast-bread-whole-grain}

<a id="table--Toast bread - Whole grain"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Toast bread / Whole grain | 1 | 25 | 59 | 2 | 11 | 1 |


### Pita (suvlaki) <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#pita--suvlaki}

<a id="table--Pita (suvlaki)"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Pita (suvlaki) | 1 | 60 | 198 | 0 | 38 | 1 |


### Chicken suvlaki <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#chicken-suvlaki}

<a id="table--Chicken suvlaki"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Chicken suvlaki | 1 | 120 | 130 | 34 | 0 | 4 |


### Yogurt / Full fat <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#yogurt-full-fat}

<a id="table--Yogurt - Full fat"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Yogurt / Full fat | 1 | 200 | 242 | 14 | 9 | 16 |


### Tzatziki <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#tzatziki}

<a id="table--Tzatziki"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Tzatziki | 1 | 20 | 75 | 2 | 1 | 5 |


### Eggwhite <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#eggwhite}

<a id="table--Eggwhite"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Eggwhite | 1 | 30 | 15 | 4 | 0 | 0 |


### Nespresso shot <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#nespresso-shot}

<a id="table--Nespresso shot"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Nespresso shot | 1 | 100 | 2 | 0 | 1 | 0 |


### Milk / Light <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#milk-light}

<a id="table--Milk - Light"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Milk / Light | 1 | 140 | 64 | 5 | 7 | 2 |


### Oat bran <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#oat-bran}

<a id="table--Oat bran"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Oat bran | 1 | 6 | 15 | 1 | 4 | 0 |


### Carrot <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#carrot}

<a id="table--Carrot"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Carrot | 1 | 30 | 12 | 0 | 3 | 0 |


### Rice <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span><span class="starch">starch</span></span> {#rice}

<a id="table--Rice"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Rice | 1 | 150 | 524 | 11 | 117 | 1 |


### Rice / Whole <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span><span class="starch">starch</span></span> {#rice-whole}

<a id="table--Rice - Whole"></a>

| INGREDIENT | SERVING | #ERROR | #ERROR | #ERROR | #ERROR | #ERROR |
|------------|---------|--------|--------|--------|--------|--------|
| Rice / Whole | 1 | 150 | 450 | 9 | 96 | 3 |


### Pork steak <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span><span class="redmeat">redmeat</span></span> {#pork-steak}

<a id="table--Pork steak"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Pork steak | 1 | 120 | 302 | 32 | 0 | 11 |


### Beef steak <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span><span class="redmeat">redmeat</span></span> {#beef-steak}

<a id="table--Beef steak"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Beef steak | 1 | 120 | 281 | 31 | 0 | 16 |


### Whey protein / Biotech <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span><span class="supplement">supplement</span></span> {#whey-protein-biotech}

<a id="table--Whey protein - Biotech"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Whey protein / Biotech | 1 | 30 | 109 | 26 | 1 | 0 |


### Orzo / Kritharaki <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#orzo-kritharaki}

<a id="table--Orzo - Kritharaki"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Orzo / Kritharaki | 1 | 0 | 0 | 0 | 0 | 0 |


### Apple <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#apple}

<a id="table--Apple"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Apple | 1 | 200 | 104 | 1 | 28 | 0 |


### Pizza margarita <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#pizza-margarita}

<a id="table--Pizza margarita"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Pizza margarita | 1 | 200 | 800 | 26 | 96 | 17 |


### Bean soup <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#bean-soup}

<a id="table--Bean soup"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Bean soup | 1 | 300 | 396 | 26 | 71 | 2 |


### Lentil soup <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#lentil-soup}

<a id="table--Lentil soup"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Lentil soup | 1 | 300 | 250 | 15 | 36 | 5 |


### Cauliflower <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#cauliflower}

<a id="table--Cauliflower"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Cauliflower | 1 | gram | 45 | 3 | 9 | 1 |


### ION with hazelnuts and stevia <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#ion-with-hazelnuts-and-stevia}

<a id="table--ION with hazelnuts and stevia"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| ION with hazelnuts and stevia | 1 | 60 | 291 | 6 | 30 | 21 |


### Icecream <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#icecream}

<a id="table--Icecream"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Icecream | 1 | 60 | 137 | 3 | 15 | 7 |


### Briam <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#briam}

<a id="table--Briam"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Briam | 1 | 7 | 192 | 7 | 26 | 5 |


### Chips / Lays <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#chips-lays}

<a id="table--Chips - Lays"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Chips / Lays | 1 | 3 | 200 | 3 | 22 | 11 |


### Pastitsio <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#pastitsio}

<a id="table--Pastitsio"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Pastitsio | 1 | 23 | 377 | 23 | 33 | 16 |


### Peach <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#peach}

<a id="table--Peach"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Peach | 1 | 0 | 39 | 1 | 10 | 0 |


### Pear <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#pear}

<a id="table--Pear"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Pear | 1 | 0 | 58 | 0 | 15 | 0 |


### Digestive / Papadopoulou <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#digestive-papadopoulou}

<a id="table--Digestive - Papadopoulou"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Digestive / Papadopoulou | 1 | 1.1 | 59 | 1.1 | 7.7 | 2.5 |


### Digestive bar chocolate chips / Papadopoulou <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#digestive-bar-chocolate-chips-papadopoulou}

<a id="table--Digestive bar chocolate chips - Papadopoulou"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Digestive bar chocolate chips / Papadopoulou | 1 | 1.5 | 126 | 1.5 | 18.5 | 4.9 |


### Tuna / Trata <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#tuna-trata}

<a id="table--Tuna - Trata"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Tuna / Trata | 1 | 23 | 98 | 23 | 0 | 0.7 |


### Oat bar / NatureTech <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#oat-bar-naturetech}

<a id="table--Oat bar - NatureTech"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Oat bar / NatureTech | 1 | 90 | 402 | 5.9 | 46.5 | 20 |


### Sausage <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#sausage}

<a id="table--Sausage"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Sausage | 1 | 100 | 300 | 12 | 2 | 27 |


### Salmon <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#salmon}

<a id="table--Salmon"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Salmon | 1 | 200 | 208 | 46 | 0 | 16 |


### Beer <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#beer}

<a id="table--Beer"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Beer | 1 |   | 311 | 1 | 10 | 0 |


### Chocolate Cake <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#chocolate-cake}

<a id="table--Chocolate Cake"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Chocolate Cake | 1 | 3.8 | 424 | 3.8 | 58 | 22 |


### Turkey burgers <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#turkey-burgers}

<a id="table--Turkey burgers"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Turkey burgers | 1 | 120 | 165 | 23 | 7.6 | 4.5 |


### Cupcake <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#cupcake}

<a id="table--Cupcake"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Cupcake | 1 | 3.2 | 228 | 3.2 | 50.2 | 2.7 |


### Swordfish <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#swordfish}

<a id="table--Swordfish"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Swordfish | 1 | 50 | 396 | 50 | 0 | 10 |


### Mushroom Risoto <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#mushroom-risoto}

<a id="table--Mushroom Risoto"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Mushroom Risoto | 1 | 300 | 367 | 7.5 | 52.5 | 14.3 |


### Strawberries <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#strawberries}

<a id="table--Strawberries"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Strawberries | 1 | 80 | 26 | 0.6 | 6.2 | 0.2 |


### Spinach Rice <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#spinach-rice}

<a id="table--Spinach Rice"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Spinach Rice | 1 | 300 | 249 | 12.2 | 50.4 | 1.2 |


### Fasolakia / Mparmpa Stathis (ladera) <span class="tag"><span class="nutrition">nutrition</span><span class="food">food</span></span> {#fasolakia-mparmpa-stathis--ladera}

<a id="table--Fasolakia - Mparmpa Stathis (ladera)"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Fasolakia / Mparmpa Stathis (ladera) | 1 | 350 | 126 | 5.6 | 28.35 | 0.7 |


## Recipes {#recipes}

To add a new recipe call \`org-capture\` and then type \`nr\`.


### Double capuccino / Light <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#double-capuccino-light}

<a id="table--Double capuccino - Light"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Nespresso shot | 2 | 200 | 4 | 0 | 1 | 0 |
| Milk / Light | 1 | 140 | 64 | 5 | 7 | 2 |
| Total |   | 340 | 68 | 5 | 8 | 2 |


### Double capuccino / Full fat <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#double-capuccino-full-fat}

<a id="table--Double capuccino - Full fat"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Nespresso shot | 2 | 200 | 4 | 0 | 1 | 0 |
| Milk / Full fat | 1 | 140 | 91 | 5 | 7 | 6 |
| Total |   | 340 | 95 | 5 | 8 | 6 |


### Omelette / Cheese and Turkey <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#omelette-cheese-and-turkey}

<a id="table--Omelette - Cheese and Turkey"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Egg | 1 | 63 | 98 | 8 | 1 | 7 |
| Toast cheese / Milner light | 1 | 30 | 48 | 7 | 4 | 3 |
| Turkey | 1 | 30 | 21 | 4 | 0 | 0 |
| Total |   | 123 | 167 | 19 | 5 | 10 |


### Omelette / Double Egg and Turkey <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#omelette-double-egg-and-turkey}

<a id="table--Omelette - Double Egg and Turkey"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Egg | 2 | 126 | 196 | 16 | 2 | 14 |
| Turkey | 1 | 30 | 21 | 4 | 0 | 0 |
| Total | 3 | 156 | 217 | 20 | 2 | 14 |


### Omelette / Double Egg and eggwhite <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#omelette-double-egg-and-eggwhite}

<a id="table--Omelette - Double Egg and eggwhite"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Egg | 2 | 126 | 196 | 16 | 2 | 14 |
| Eggwhite | 2 | 60 | 30 | 7 | 0 | 0 |
| Total |   | 186 | 226 | 23 | 2 | 14 |


### Omelette / Double Egg with cheese <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#omelette-double-egg-with-cheese}

<a id="table--Omelette - Double Egg with cheese"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Egg | 2 | 126 | 196 | 16 | 2 | 14 |
| Toast cheese / Milner light | 1 | 30 | 48 | 7 | 4 | 3 |
| Total |   | 156 | 244 | 23 | 6 | 17 |


### Tortilla with honey, hazelnut paste, banana and blueberries <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#tortilla-with-honey-hazelnut-paste-banana-and-blueberries}

<a id="table--Tortilla with honey, hazelnut paste, banana and blueberries"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Tortilla / El Sabor | 1 | 60 | 188 | 5 | 28 | 6 |
| Honey with Hazelnut paste | 1 | 10 | 61 | 1 | 10 | 2 |
| Banana / Medium | 0.5 | 50 | 50 | 6 | 12 | 1 |
| Dried Blueberries | 1 | 10 | 35 | 0 | 9 | 0 |
| Total | 3 | 130 | 334 | 12 | 59 | 9 |


### Tortilla with egg, cheese and turkey <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#tortilla-with-egg-cheese-and-turkey}

<a id="table--Tortilla with egg, cheese and turkey"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Egg | 1 | 63 | 98 | 8 | 1 | 7 |
| Toast cheese / Milner light | 1 | 30 | 48 | 7 | 4 | 3 |
| Turkey | 1 | 30 | 21 | 4 | 0 | 0 |
| Total |   | 123 | 167 | 19 | 5 | 10 |


### Tortilla with egg and avocado <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#tortilla-with-egg-and-avocado}

<a id="table--Tortilla with egg and avocado"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Tortilla / El Sabor | 1 | 60 | 188 | 5 | 28 | 6 |
| Egg | 1 | 63 | 98 | 8 | 1 | 7 |
| Avocado | 1 | 70 | 187 | 2 | 11 | 18 |
| Total |   | 193 | 473 | 15 | 40 | 31 |


### Tortilla with honey, peanutbutter, banana and walnuts <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#tortilla-with-honey-peanutbutter-banana-and-walnuts}

<a id="table--Tortilla with honey, peanutbutter, banana and walnuts"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Tortilla / El Sabor | 1 | 60 | 188 | 5 | 28 | 6 |
| Honey with Peanut paste | 1 | 10 | 61 | 1 | 10 | 2 |
| Banana / Medium | 1 | 100 | 100 | 12 | 23 | 2 |
| Walnuts | 1 | 24 | 157 | 4 | 3 | 16 |
| Total |   | 194 | 506 | 22 | 64 | 26 |


### Tortilla with egg and cheese <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#tortilla-with-egg-and-cheese}

<a id="table--Tortilla with egg and cheese"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Tortilla / El Sabor | 1 | 60 | 188 | 5 | 28 | 6 |
| Egg | 1 | 63 | 98 | 8 | 1 | 7 |
| Toast cheese / Milner light | 1 | 30 | 48 | 7 | 4 | 3 |
| Total |   | 153 | 334 | 20 | 33 | 16 |


### Tortilla with egg and philadelphia <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#tortilla-with-egg-and-philadelphia}

<a id="table--Tortilla with egg and philadelphia"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Tortilla / El Sabor | 1 | 60 | 188 | 5 | 28 | 6 |
| Egg | 1 | 63 | 98 | 8 | 1 | 7 |
| Philadelphia cheese / light | 1 | 30 | 45 | 2 | 4 | 3 |
| Total |   | 153 | 331 | 15 | 33 | 16 |


### Tortilla with chicken breast <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#tortilla-with-chicken-breast}

<a id="table--Tortilla with chicken breast"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Tortilla / El Sabor | 1 | 60 | 188 | 5 | 28 | 6 |
| Chicken breast | 1 | 120 | 170 | 32 | 4 | 0 |
| Philadelphia cheese / light | 1 | 24 | 157 | 4 | 3 | 16 |
| Total |   | 204 | 515 | 41 | 35 | 22 |


### Pasta salad <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#pasta-salad}

<a id="table--Pasta salad"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Spaghetti / Whole grain | 1 | 210 | 736 | 27 | 138 | 5 |
| Turkey | 3 | 90 | 63 | 12 | 0 | 0 |
| Toast cheese / Milner light | 1 | 30 | 48 | 7 | 4 | 3 |
| Philadelphia cheese / light | 1 | 24 | 157 | 4 | 3 | 16 |
| Total |   | 354 | 1004 | 50 | 145 | 24 |


### Lettuce salad <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span><span class="salad">salad</span></span> {#lettuce-salad}

<a id="table--Lettuce salad"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Lettuce | 1 | 180 | 25 | 3 | 5 | 0 |
| Olive oil | 1 | 10 | 82 | 1 | 1 | 9 |
| Total |   | 190 | 107 | 4 | 6 | 9 |


### Spinach and rucola salad <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span><span class="salad">salad</span></span> {#spinach-and-rucola-salad}

<a id="table--Spinach and rucola salad"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Spinach | 1 | 100 | 34 | 3 | 3 | 0 |
| Rucola | 1 | 100 | 25 | 3 | 4 | 1 |
| Olive oil | 1 | 10 | 82 | 1 | 1 | 9 |
| Total |   | 210 | 141 | 7 | 8 | 10 |


### Cabbage and carrot salad <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span><span class="salad">salad</span></span> {#cabbage-and-carrot-salad}

<a id="table--Cabbage and carrot salad"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Cabbage | 1.5 | 150 | 36 | 3 | 9 | 1 |
| Carrot | 1 | 30 | 12 | 0 | 3 | 0 |
| Olive oil | 1 | 10 | 82 | 1 | 1 | 9 |
| Total |   | 190 | 130 | 4 | 13 | 10 |


### Broccoli salad <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span><span class="salad">salad</span></span> {#broccoli-salad}

<a id="table--Broccoli salad"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Broccoli | 1 | 100 | 45 | 4 | 8 | 1 |
| Olive oil | 1 | 10 | 82 | 1 | 1 | 9 |
| Total |   | 110 | 127 | 5 | 9 | 10 |


### Potato salad <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#potato-salad}

<a id="table--Potato salad"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Potato | 1 | 225 | 193 | 4 | 45 | 0 |
| Egg | 1 | 63 | 98 | 8 | 1 | 7 |
| Lettuce | 1 | 180 | 25 | 3 | 5 | 0 |
| Olive oil | 1 | 10 | 82 | 1 | 1 | 9 |
| Total |   | 478 | 398 | 16 | 52 | 16 |


### Toast with cheese <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#toast-with-cheese}

<a id="table--Toast with cheese"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Toast bread / Whole grain | 1 | 25 | 59 | 2 | 11 | 1 |
| Toast cheese / Milner light | 1 | 30 | 48 | 7 | 4 | 3 |
| Total |   | 55 | 107 | 9 | 15 | 4 |


### Pita with chicken suvlaki <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#pita-with-chicken-suvlaki}

<a id="table--Pita with chicken suvlaki"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Pita (suvlaki) | 1 | 60 | 198 | 0 | 38 | 1 |
| Chicken suvlaki | 1 | 120 | 130 | 34 | 0 | 4 |
| Tomato | 0.25 | 50 | 9 | 1 | 2 | 0 |
| Tzatziki | 1 | 20 | 75 | 2 | 1 | 5 |
| Total |   | 250 | 412 | 37 | 41 | 10 |


### Whole bread with egg and avocado <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#whole-bread-with-egg-and-avocado}

<a id="table--Whole bread with egg and avocado"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Bread / Whole grain | 1 | 30 | 65 | 3 | 13 | 1 |
| Egg | 1 | 63 | 98 | 8 | 1 | 7 |
| Avocado | 1 | 70 | 187 | 2 | 11 | 18 |
| Total |   | 163 | 350 | 13 | 25 | 26 |


### Whole bread with honey and sesame paste <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#whole-bread-with-honey-and-sesame-paste}

<a id="table--Whole bread with honey and sesame paste"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Honey / Αττική | 1 | 10 | 34 | 0 | 8 | 0 |
| Sesame paste | 1 | 10 | 63 | 3 | 1 | 6 |
| Bread / Whole grain | 2 | 60 | 130 | 6 | 26 | 2 |
| Total |   | 80 | 227 | 9 | 35 | 8 |


### Whole bread with peanutbutter and honey <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#whole-bread-with-peanutbutter-and-honey}

<a id="table--Whole bread with peanutbutter and honey"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Bread / Whole grain | 2 | 60 | 130 | 6 | 26 | 2 |
| Peanutbutter | 1 | 10 | 56 | 3 | 1 | 4 |
| Honey / Αττική | 1 | 10 | 34 | 0 | 8 | 0 |
| Total |   | 80 | 220 | 9 | 35 | 6 |


### Yogurt with honey and walnuts <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#yogurt-with-honey-and-walnuts}

<a id="table--Yogurt with honey and walnuts"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Yogurt / Light 2 percent | 1 | 200 | 142 | 16 | 11 | 4 |
| Honey / Αττική | 1 | 10 | 34 | 0 | 8 | 0 |
| Walnuts | 1 | 24 | 157 | 4 | 3 | 16 |
| Total |   | 234 | 333 | 20 | 22 | 20 |


### Chicken breast with potatos <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#chicken-breast-with-potatos}

<a id="table--Chicken breast with potatos"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Chicken breast | 1 | 120 | 170 | 32 | 4 | 0 |
| Potato | 1 | 225 | 193 | 4 | 45 | 0 |
| Total |   | 345 | 363 | 36 | 49 | 0 |


### Oat beef burger <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#oat-beef-burger}

<a id="table--Oat beef burger"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Ground meat / Beef | 1.33 | 120 | 257 | 32 | 0 | 14 |
| Oat bran | 1 | 6 | 15 | 1 | 4 | 0 |
| Olive oil | 0.5 | 5 | 41 | 1 | 1 | 5 |
| Total |   | 131 | 313 | 34 | 5 | 19 |


### Chicken breast with Qinoa <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#chicken-breast-with-qinoa}

<a id="table--Chicken breast with Qinoa"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Chicken breast | 1 | 120 | 170 | 32 | 4 | 0 |
| Quinoa / Red | 1 | 190 | 669 | 27 | 108 | 12 |
| Total |   | 310 | 839 | 59 | 112 | 12 |


### Chicken breast with rice <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#chicken-breast-with-rice}

<a id="table--Chicken breast with rice"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Chicken breast | 1 | 120 | 170 | 32 | 4 | 0 |
| Rice | 1 | 150 | 524 | 11 | 117 | 1 |
| Total |   | 270 | 694 | 43 | 121 | 1 |


### Chicken breast with brown rice <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#chicken-breast-with-brown-rice}

<a id="table--Chicken breast with brown rice"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Chicken breast | 1 | 120 | 170 | 32 | 4 | 0 |
| Rice / Whole | 1 | 150 | 450 | 9 | 96 | 3 |
| Total |   | 270 | 620 | 41 | 100 | 3 |


### Mini ntakos with cottage cheese <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#mini-ntakos-with-cottage-cheese}

<a id="table--Mini ntakos with cottage cheese"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Rusk / Manna | 1 | 30 | 124 | 4 | 22 | 3 |
| Tomato | 0.5 | 100 | 18 | 1 | 4 | 0 |
| Cottage Cheese / Light 4% | 1 | 100 | 92 | 11 | 3 | 4 |
| Olive oil | 1 | 10 | 82 | 1 | 1 | 9 |
| Total |   | 240 | 316 | 17 | 30 | 16 |


### Seam beam <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span><span class="fish">fish</span></span> {#seam-beam}

<a id="table--Seam beam"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Seam beam | 1 | 200 | 367 | 47 | 0 | 20 |
| Total |   | 200 | 367 | 47 | 0 | 20 |


### Levantina fish <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span><span class="fish">fish</span></span> {#levantina-fish}

<a id="table--Levantina fish"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Levantina fish | 1 | 200 | 320 | 49 | 0 | 13 |
| Total |   | 200 | 320 | 49 | 0 | 13 |


### Toast with cheese and turkey <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#toast-with-cheese-and-turkey}

<a id="table--Toast with cheese and turkey"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Toast bread / Whole grain | 1 | 25 | 59 | 2 | 11 | 1 |
| Toast cheese / Milner light | 1 | 30 | 48 | 7 | 4 | 3 |
| Turkey | 1 | 30 | 21 | 4 | 0 | 0 |
| Total |   | 85 | 128 | 13 | 15 | 4 |


### Braised chicken <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#braised-chicken}

<a id="table--Braised chicken"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Chicken breast | 1 | 120 | 170 | 32 | 4 | 0 |
| Tomato | 1 | 200 | 36 | 2 | 8 | 0 |
| Olive oil | 1 | 10 | 82 | 1 | 1 | 9 |
| Total |   | 330 | 288 | 35 | 13 | 9 |


### Chicken with orzo <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#chicken-with-orzo}

<a id="table--Chicken with orzo"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Chicken breast | 1 | 120 | 170 | 32 | 4 | 0 |
| Orzo / Kritharaki | 1 | 150 | 150 | 18 | 97 | 4 |
| Tomato | 1 | 200 | 36 | 2 | 8 | 0 |
| Olive oil | 1 | 10 | 82 | 1 | 1 | 9 |
| Total |   | 480 | 438 | 53 | 110 | 13 |


### Banana with walnuts <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#banana-with-walnuts}

<a id="table--Banana with walnuts"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Banana / Medium | 1 | 100 | 100 | 12 | 23 | 2 |
| Walnuts | 1 | 24 | 157 | 4 | 3 | 16 |
| Total |   | 124 | 257 | 16 | 26 | 18 |


### Cauliflower salad <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span><span class="salad">salad</span></span> {#cauliflower-salad}

<a id="table--Cauliflower salad"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Cauliflower | 1 | 180 | 45 | 3 | 9 | 1 |
| Olive oil | 1 | 10 | 82 | 1 | 1 | 9 |
| Total |   | 190 | 127 | 4 | 10 | 10 |


### Tortilla with sesame paste and walnuts <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#tortilla-with-sesame-paste-and-walnuts}

<a id="table--Tortilla with sesame paste and walnuts"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Tortilla / El Sabor | 1 | 60 | 188 | 5 | 28 | 6 |
| Sesame paste | 1 | 10 | 63 | 3 | 1 | 6 |
| Walnuts | 1 | 24 | 157 | 4 | 3 | 16 |
| Total |   | 94 | 408 | 12 | 32 | 28 |


### Toast / Whole grain with Cheese and Turkey <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#toast-whole-grain-with-cheese-and-turkey}

<a id="table--Toast - Whole grain with Cheese and Turkey"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Bread / Whole grain | 1 | 30 | 65 | 3 | 13 | 1 |
| Toast cheese / Milner light | 1 | 30 | 48 | 7 | 4 | 3 |
| Turkey | 1 | 30 | 21 | 4 | 0 | 0 |
| Total |   | 90 | 134 | 14 | 17 | 4 |


### Omelette / Double egg <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#omelette-double-egg}

<a id="table--Omelette - Double egg"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Egg | 2 | 126 | 196 | 16 | 2 | 14 |
| Total |   | 126 | 196 | 16 | 2 | 14 |


### Omelette / Double Egg and Lentil Soup <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#omelette-double-egg-and-lentil-soup}

<a id="table--Omelette - Double Egg and Lentil Soup"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Egg | 2 | 126 | 196 | 16 | 2 | 14 |
| Lentil soup | 0.2 | 60 | 50 | 3 | 8 | 1 |
| Total |   | 186 | 246 | 19 | 10 | 15 |


### Tortilla with Lentil Soup and Cottage Cheese <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#tortilla-with-lentil-soup-and-cottage-cheese}

<a id="table--Tortilla with Lentil Soup and Cottage Cheese"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Tortilla / El Sabor | 1 | 60 | 188 | 5 | 28 | 6 |
| Lentil soup | 1 | 300 | 250 | 15 | 36 | 5 |
| Cottage Cheese / Light 4% | 1 | 100 | 92 | 11 | 3 | 4 |
| Total |   | 460 | 530 | 31 | 67 | 15 |


### Tortilla with Banana Peanutbutter and Sesame Paste <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#tortilla-with-banana-peanutbutter-and-sesame-paste}

<a id="table--Tortilla with Banana Peanutbutter and Sesame Paste"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Tortilla / El Sabor | 1 | 60 | 188 | 5 | 28 | 6 |
| Banana / Medium | 1 | 63 | 98 | 8 | 1 | 7 |
| Peanutbutter | 1 | 10 | 56 | 3 | 1 | 4 |
| Sesame paste | 1 | 10 | 63 | 3 | 1 | 6 |
| Total |   | 143 | 405 | 19 | 31 | 23 |


### Tortilla with Banana Honey and Sesame paste <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#tortilla-with-banana-honey-and-sesame-paste}

<a id="table--Tortilla with Banana Honey and Sesame paste"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Tortilla / El Sabor | 1 | 60 | 188 | 5 | 28 | 6 |
| Banana / Medium | 0.5 | 32 | 49 | 4 | 1 | 4 |
| Honey / Αττική | 1 | 10 | 34 | 0 | 8 | 0 |
| Sesame paste | 1 | 10 | 63 | 3 | 1 | 6 |
| Total |   | 112 | 334 | 12 | 38 | 16 |


### Whole bread with sesame paste and honey <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#whole-bread-with-sesame-paste-and-honey}

<a id="table--Whole bread with sesame paste and honey"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Bread / Whole grain | 1 | 30 | 65 | 3 | 13 | 1 |
| Sesame paste | 1 | 10 | 63 | 3 | 1 | 6 |
| Honey / Αττική | 1 | 10 | 34 | 0 | 8 | 0 |
| Total |   | 50 | 162 | 6 | 22 | 7 |


### Bread with avocado and egg <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#bread-with-avocado-and-egg}

<a id="table--Bread with avocado and egg"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Toast bread / Whole grain | 1 | 25 | 59 | 2 | 11 | 1 |
| Egg | 1 | 63 | 98 | 8 | 1 | 7 |
| Avocado | 0.5 | 35 | 94 | 1 | 6 | 9 |
| Total |   | 123 | 251 | 11 | 18 | 17 |


### Yogurt light with honey <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#yogurt-light-with-honey}

<a id="table--Yogurt light with honey"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Yogurt / Light 2 percent | 1 | 200 | 142 | 16 | 11 | 4 |
| Honey / Αττική | 1 | 10 | 34 | 0 | 8 | 0 |
| Total |   | 210 | 176 | 16 | 19 | 4 |


### Yogurt light with honey <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#yogurt-light-with-honey}


### Omelette / Double egg avocado cheese and turkey <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#omelette-double-egg-avocado-cheese-and-turkey}

<a id="table--Omelette - Double egg avocado cheese and turkey"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Egg | 2 | 126 | 196 | 16 | 2 | 14 |
| Avocado | 0.5 | 35 | 94 | 1 | 6 | 9 |
| Turkey | 1 | 30 | 21 | 4 | 0 | 0 |
| Toast cheese / Milner light | 1 | 30 | 48 | 7 | 4 | 3 |
| Total |   | 221 | 359 | 28 | 12 | 26 |


### Bacon cheeseburger with fries <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#bacon-cheeseburger-with-fries}

<a id="table--Bacon cheeseburger with fries"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Bacon cheeseburger with fries | 1 | 316 | 900 | 34 | 88 | 46 |
| Total |   | 316 | 900 | 34 | 88 | 46 |


### Omelette / Double egg and cheese <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#omelette-double-egg-and-cheese}

<a id="table--Omelette - Double egg and cheese"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Egg | 2 | 126 | 196 | 16 | 2 | 14 |
| Toast cheese / Milner light | 1 | 30 | 48 | 7 | 4 | 3 |
| None | 1 | 0 | 0 | 0 | 0 | 0 |
| None | 1 | 0 | 0 | 0 | 0 | 0 |
| Total |   | 156 | 244 | 23 | 6 | 17 |


### Bread with egg and cheese <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#bread-with-egg-and-cheese}

<a id="table--Bread with egg and cheese"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Bread / Whole grain | 1 | 30 | 65 | 3 | 13 | 1 |
| Egg | 1 | 63 | 98 | 8 | 1 | 7 |
| Toast cheese / Milner light | 1 | 30 | 48 | 7 | 4 | 3 |
| Total |   | 123 | 211 | 18 | 18 | 11 |


### Strapatsada <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#strapatsada}

<a id="table--Strapatsada"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Egg | 3 | 189 | 294 | 24 | 3 | 21 |
| Tomato | 1 | 200 | 36 | 2 | 8 | 0 |
| Cottage Cheese / Light 4% | 1 | 100 | 92 | 11 | 3 | 4 |
| Total |   | 489 | 422 | 37 | 14 | 25 |


### Yogurt light with Whey <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#yogurt-light-with-whey}

<a id="table--Yogurt light with Whey"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Yogurt / Light 2 percent | 1 | 200 | 142 | 16 | 11 | 4 |
| Whey protein / Biotech | 0.25 | 8 | 28 | 7 | 1 | 0 |
| None | 1 | 0 | 0 | 0 | 0 | 0 |
| None | 1 | 0 | 0 | 0 | 0 | 0 |
| Total |   | 208 | 170 | 23 | 12 | 4 |


### Bread with honey and sesame paste <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#bread-with-honey-and-sesame-paste}

<a id="table--Bread with honey and sesame paste"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Bread / Whole grain | 1 | 30 | 65 | 3 | 13 | 1 |
| Honey / Αττική | 1 | 10 | 34 | 0 | 8 | 0 |
| Sesame paste | 1 | 10 | 63 | 3 | 1 | 6 |
| None | 1 | 0 | 0 | 0 | 0 | 0 |
| Total |   | 50 | 162 | 6 | 22 | 7 |


### Lemon sauce calf <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#lemon-sauce-calf}

<a id="table--Lemon sauce calf"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Beef steak | 1.16 | 140 | 326 | 36 | 0 | 19 |
| Olive Oil | 1 | 10 | 82 | 1 | 1 | 9 |
| Total |   | 150 | 408 | 37 | 1 | 28 |


### Tortilla with strawberries, honey and sesame paste <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#tortilla-with-strawberries-honey-and-sesame-paste}

<a id="table--Tortilla with strawberries, honey and sesame paste"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Tortilla / El Sabor | 1 | 60 | 188 | 5 | 28 | 6 |
| Strawberries | 1 | 80 | 26 | 1 | 7 | 1 |
| Honey / Αττική | 1 | 10 | 34 | 0 | 8 | 0 |
| Sesame paste | 1 | 10 | 63 | 3 | 1 | 6 |
| Total |   | 160 | 311 | 9 | 44 | 13 |


### Tortilla with cheese and turkey <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#tortilla-with-cheese-and-turkey}

<a id="table--Tortilla with cheese and turkey"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Tortilla / El Sabor | 1 | 60 | 188 | 5 | 28 | 6 |
| Toast cheese / Milner light | 1 | 30 | 48 | 7 | 4 | 3 |
| Turkey | 1 | 30 | 21 | 4 | 0 | 0 |
| Total |   | 120 | 257 | 16 | 32 | 9 |


### Tomato salad / Ntakos <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#tomato-salad-ntakos}

<a id="table--Tomato salad - Ntakos"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Tomato | 2 | 400 | 72 | 4 | 16 | 0 |
| Cottage Cheese / Light 4% | 2.2 | 221 | 203 | 25 | 7 | 9 |
| Rusk / Manna | 1.5 | 45 | 186 | 6 | 33 | 5 |
| Olive Oil | 1 | 10 | 82 | 1 | 1 | 9 |
| Total |   | 676 | 543 | 36 | 57 | 23 |


### Omelette / Tripple eggwhites oat and light cheese <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#omelette-tripple-eggwhites-oat-and-light-cheese}

<a id="table--Omelette - Tripple eggwhites oat and light cheese"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Eggwhite | 3 | 90 | 45 | 12 | 0 | 0 |
| Oat bran | 1 | 6 | 15 | 1 | 4 | 0 |
| Toast cheese / Milner light | 1 | 30 | 48 | 7 | 4 | 3 |
| None | 1 | 0 | 0 | 0 | 0 | 0 |
| Total |   | 126 | 108 | 20 | 8 | 3 |


### Omelette / Double eggwhite oat and cheese light <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#omelette-double-eggwhite-oat-and-cheese-light}

<a id="table--Omelette - Double eggwhite oat and cheese light"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Eggwhite | 1 | 30 | 15 | 4 | 0 | 0 |
| Oat bran | 1 | 6 | 15 | 1 | 4 | 0 |
| Toast cheese / Milner light | 1 | 30 | 48 | 7 | 4 | 3 |
| Total |   | 66 | 78 | 12 | 8 | 3 |


### Fasolakia with Cottage light <span class="tag"><span class="nutrition">nutrition</span><span class="recipe">recipe</span></span> {#fasolakia-with-cottage-light}

<a id="table--Fasolakia with Cottage light"></a>

| INGREDIENT | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------------|---------|----------|----------|---------|-------|-----|
| Fasolakia / Mparmpa Stathis (ladera) | 1 | 350 | 126 | 6 | 29 | 1 |
| Cottage Cheese / Light 4% | 1 | 100 | 92 | 11 | 3 | 4 |
| Total |   | 450 | 218 | 17 | 32 | 5 |


## Meals {#meals}

The table below contains all logged meals.
To capture a new meal, call \`org-capture\` and then type \`nm\`.

<a id="table--Meals"></a>

| DATE | MEAL | SERVING | QUANTITY | CALORIES | PROTEIN | CARBS | FAT |
|------|------|---------|----------|----------|---------|-------|-----|
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-22 Mon&gt;</span></span> | Tortilla with Banana Peanutbutter and Sesame Paste | 1 | 143 | 405 | 19 | 31 | 23 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-22 Mon&gt;</span></span> | Oat burgers | 1 | 120 | 226 | 17 | 17 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-22 Mon&gt;</span></span> | Lettuce salad | 1 | 190 | 107 | 4 | 6 | 9 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-22 Mon&gt;</span></span> | Spaghetti / Whole grain | 1 | 210 | 736 | 27 | 138 | 5 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-22 Mon&gt;</span></span> | Oat burgers | 1 | 120 | 226 | 17 | 17 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-22 Mon&gt;</span></span> | Lettuce salad | 1 | 190 | 107 | 4 | 6 | 9 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-22 Mon&gt;</span></span> | Digestive / Papadopoulou | 2 | 3 | 118 | 3 | 16 | 5 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-22 Mon&gt;</span></span> | Digestive bar chocolate chips / Papadopoulou | 1 | 2 | 126 | 2 | 19 | 5 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-23 Tue&gt;</span></span> | Tortilla with Banana Honey and Sesame paste | 1 | 112 | 334 | 12 | 38 | 16 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-23 Tue&gt;</span></span> | Toast with cheese and turkey | 1 | 85 | 128 | 13 | 15 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-23 Tue&gt;</span></span> | Chicken breast with rice | 2 | 540 | 1388 | 86 | 242 | 2 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-23 Tue&gt;</span></span> | Whey protein / Biotech | 1 | 30 | 109 | 26 | 1 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-23 Tue&gt;</span></span> | Lettuce salad | 2 | 380 | 214 | 8 | 12 | 18 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-24 Wed&gt;</span></span> | Tortilla with Banana Peanutbutter and Sesame Paste | 1 | 143 | 405 | 19 | 31 | 23 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-24 Wed&gt;</span></span> | Toast with cheese and turkey | 1 | 85 | 128 | 13 | 15 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-24 Wed&gt;</span></span> | Whey protein / Biotech | 1 | 30 | 109 | 26 | 1 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-24 Wed&gt;</span></span> | Egg | 2 | 126 | 196 | 16 | 2 | 14 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-24 Wed&gt;</span></span> | Bean soup | 1 | 300 | 396 | 26 | 71 | 2 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-24 Wed&gt;</span></span> | Tuna / Trata | 1 | 23 | 98 | 23 | 0 | 1 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-24 Wed&gt;</span></span> | Broccoli salad | 1 | 110 | 127 | 5 | 9 | 10 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-24 Wed&gt;</span></span> | Yogurt light with honey | 1 | 210 | 176 | 16 | 19 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-24 Wed&gt;</span></span> | Rice | 0.25 | 38 | 131 | 3 | 30 | 1 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-25 Thu&gt;</span></span> | Bread / Whole grain | 1 | 30 | 65 | 3 | 13 | 1 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-25 Thu&gt;</span></span> | Honey / Αττική | 2 | 20 | 68 | 0 | 16 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-25 Thu&gt;</span></span> | Sesame paste | 4 | 40 | 252 | 12 | 4 | 24 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-25 Thu&gt;</span></span> | Apple | 1 | 200 | 104 | 1 | 28 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-25 Thu&gt;</span></span> | Oat burgers | 2 | 240 | 452 | 34 | 34 | 8 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-25 Thu&gt;</span></span> | Lettuce salad | 2 | 380 | 214 | 8 | 12 | 18 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-25 Thu&gt;</span></span> | Whey protein / Biotech | 1 | 30 | 109 | 26 | 1 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-25 Thu&gt;</span></span> | Digestive bar chocolate chips / Papadopoulou | 1 | 2 | 126 | 2 | 19 | 5 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-26 Fri&gt;</span></span> | Omelette / Double Egg with cheese | 1 | 156 | 244 | 23 | 6 | 17 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-26 Fri&gt;</span></span> | Apple | 1 | 200 | 104 | 1 | 28 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-26 Fri&gt;</span></span> | Seam beam | 1 | 200 | 367 | 47 | 0 | 20 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-26 Fri&gt;</span></span> | Lettuce salad | 1 | 190 | 107 | 4 | 6 | 9 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-26 Fri&gt;</span></span> | Oat bar / NatureTech | 1 | 90 | 402 | 6 | 47 | 20 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-26 Fri&gt;</span></span> | Seam beam | 0.5 | 100 | 184 | 24 | 0 | 10 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-26 Fri&gt;</span></span> | Whey protein / Biotech | 1 | 30 | 109 | 26 | 1 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-26 Fri&gt;</span></span> | Broccoli salad | 1 | 110 | 127 | 5 | 9 | 10 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-26 Fri&gt;</span></span> | Rusk / Manna | 1 | 30 | 124 | 4 | 22 | 3 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-27 Sat&gt;</span></span> | Omelette / Double egg and cheese | 1 | 156 | 244 | 23 | 6 | 17 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-27 Sat&gt;</span></span> | Toast with cheese and turkey | 1 | 85 | 128 | 13 | 15 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-27 Sat&gt;</span></span> | Pita with chicken suvlaki | 1 | 250 | 412 | 37 | 41 | 10 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-27 Sat&gt;</span></span> | Lettuce salad | 1 | 190 | 107 | 4 | 6 | 9 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-27 Sat&gt;</span></span> | Chicken breast | 1 | 120 | 170 | 32 | 4 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-27 Sat&gt;</span></span> | Lettuce salad | 1 | 190 | 107 | 4 | 6 | 9 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-27 Sat&gt;</span></span> | Yogurt with honey and walnuts | 1 | 234 | 333 | 20 | 22 | 20 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-27 Sat&gt;</span></span> | Rusk / Manna | 1 | 30 | 124 | 4 | 22 | 3 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-28 Sun&gt;</span></span> | Omelette / Double egg and cheese | 1 | 156 | 244 | 23 | 6 | 17 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-01 Mon&gt;</span></span> | Omelette / Double Egg with cheese | 1 | 156 | 244 | 23 | 6 | 17 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-01 Mon&gt;</span></span> | Apple | 1 | 200 | 104 | 1 | 28 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-01 Mon&gt;</span></span> | Chicken breast with potatos | 1 | 345 | 363 | 36 | 49 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-01 Mon&gt;</span></span> | Lettuce salad | 1 | 190 | 107 | 4 | 6 | 9 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-01 Mon&gt;</span></span> | Digestive bar chocolate chips / Papadopoulou | 1 | 2 | 126 | 2 | 19 | 5 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-01 Mon&gt;</span></span> | Whey protein / Biotech | 1 | 30 | 109 | 26 | 1 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-01 Mon&gt;</span></span> | Chicken breast | 1 | 120 | 170 | 32 | 4 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-01 Mon&gt;</span></span> | Lettuce salad | 1 | 190 | 107 | 4 | 6 | 9 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-02 Tue&gt;</span></span> | Bread with egg and cheese | 1 | 123 | 211 | 18 | 18 | 11 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-02 Tue&gt;</span></span> | Yogurt light with honey | 1 | 210 | 176 | 16 | 19 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-02 Tue&gt;</span></span> | Lentil soup | 1 | 300 | 250 | 15 | 36 | 5 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-02 Tue&gt;</span></span> | Tuna / Trata | 1 | 23 | 98 | 23 | 0 | 1 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-02 Tue&gt;</span></span> | Whey protein / Biotech | 1 | 30 | 109 | 26 | 1 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-02 Tue&gt;</span></span> | Banana / Medium | 1 | 63 | 98 | 8 | 1 | 7 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-02 Tue&gt;</span></span> | Strapatsada | 1 | 489 | 422 | 37 | 14 | 25 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-28 Sun&gt;</span></span> | Apple | 1 | 200 | 104 | 1 | 28 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-28 Sun&gt;</span></span> | Oat burgers | 1 | 120 | 226 | 17 | 17 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-28 Sun&gt;</span></span> | Rice | 1 | 150 | 524 | 11 | 117 | 1 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-28 Sun&gt;</span></span> | Lettuce salad | 1 | 190 | 107 | 4 | 6 | 9 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-28 Sun&gt;</span></span> | Chicken breast | 1 | 120 | 170 | 32 | 4 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-28 Sun&gt;</span></span> | Lettuce salad | 1 | 190 | 107 | 4 | 6 | 9 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-28 Sun&gt;</span></span> | Yogurt light with honey | 1 | 210 | 176 | 16 | 19 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-03 Wed&gt;</span></span> | Omelette / Double egg and cheese | 1 | 156 | 244 | 23 | 6 | 17 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-03 Wed&gt;</span></span> | Banana / Medium | 1 | 63 | 98 | 8 | 1 | 7 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-03 Wed&gt;</span></span> | Seam beam | 2 | 400 | 734 | 94 | 0 | 40 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-03 Wed&gt;</span></span> | Cabbage and carrot salad | 2 | 380 | 260 | 8 | 26 | 20 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-03 Wed&gt;</span></span> | Yogurt with honey and walnuts | 1 | 234 | 333 | 20 | 22 | 20 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-04 Thu&gt;</span></span> | Tortilla with Banana Honey and Sesame paste | 1 | 112 | 334 | 12 | 38 | 16 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-04 Thu&gt;</span></span> | Pork steak | 1 | 120 | 302 | 32 | 0 | 11 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-04 Thu&gt;</span></span> | Cabbage and carrot salad | 1 | 190 | 130 | 4 | 13 | 10 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-04 Thu&gt;</span></span> | Whey protein / Biotech | 1 | 30 | 109 | 26 | 1 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-04 Thu&gt;</span></span> | Yogurt with honey and walnuts | 2 | 468 | 666 | 40 | 44 | 40 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-04 Thu&gt;</span></span> | Sausage | 1 | 100 | 300 | 12 | 2 | 27 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-05 Fri&gt;</span></span> | Bread / Whole grain | 1 | 30 | 65 | 3 | 13 | 1 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-05 Fri&gt;</span></span> | Honey / Αττική | 1 | 10 | 34 | 0 | 8 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-05 Fri&gt;</span></span> | Sesame paste | 1 | 10 | 63 | 3 | 1 | 6 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-05 Fri&gt;</span></span> | Seam beam | 0.5 | 100 | 184 | 24 | 0 | 10 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-05 Fri&gt;</span></span> | Cabbage and carrot salad | 1 | 190 | 130 | 4 | 13 | 10 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-05 Fri&gt;</span></span> | Pork steak | 1 | 120 | 302 | 32 | 0 | 11 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-05 Fri&gt;</span></span> | Potato | 2 | 450 | 386 | 8 | 90 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-06 Sat&gt;</span></span> | Omelette / Double egg and cheese | 1 | 156 | 244 | 23 | 6 | 17 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-06 Sat&gt;</span></span> | Yogurt with honey and walnuts | 1 | 234 | 333 | 20 | 22 | 20 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-06 Sat&gt;</span></span> | Salmon | 1 | 200 | 208 | 46 | 0 | 16 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-06 Sat&gt;</span></span> | Lettuce salad | 1 | 190 | 107 | 4 | 6 | 9 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-06 Sat&gt;</span></span> | Beer | 2 | 0 | 622 | 2 | 20 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-06 Sat&gt;</span></span> | Chocolate Cake | 2 | 8 | 848 | 8 | 116 | 44 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-07 Sun&gt;</span></span> | Tortilla with Banana Honey and Sesame paste | 1 | 112 | 334 | 12 | 38 | 16 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-07 Sun&gt;</span></span> | Yogurt with honey and walnuts | 1 | 234 | 333 | 20 | 22 | 20 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-07 Sun&gt;</span></span> | Chicken breast | 1 | 120 | 170 | 32 | 4 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-07 Sun&gt;</span></span> | Oat burgers | 1 | 120 | 226 | 17 | 17 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-07 Sun&gt;</span></span> | Turkey burgers | 1 | 120 | 165 | 23 | 8 | 5 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-07 Sun&gt;</span></span> | Lettuce salad | 1 | 190 | 107 | 4 | 6 | 9 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-07 Sun&gt;</span></span> | Yogurt with honey and walnuts | 0.5 | 117 | 167 | 10 | 11 | 10 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-07 Sun&gt;</span></span> | Oat burgers | 1 | 120 | 226 | 17 | 17 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-08 Mon&gt;</span></span> | Bread / Whole grain | 1 | 30 | 65 | 3 | 13 | 1 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-08 Mon&gt;</span></span> | Honey / Αττική | 1 | 10 | 34 | 0 | 8 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-08 Mon&gt;</span></span> | Sesame paste | 1 | 10 | 63 | 3 | 1 | 6 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-08 Mon&gt;</span></span> | Oat burgers | 1 | 120 | 226 | 17 | 17 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-08 Mon&gt;</span></span> | Lettuce salad | 1 | 190 | 107 | 4 | 6 | 9 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-08 Mon&gt;</span></span> | Oat burgers | 1 | 120 | 226 | 17 | 17 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-08 Mon&gt;</span></span> | Potato | 1 | 225 | 193 | 4 | 45 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-08 Mon&gt;</span></span> | Lettuce salad | 1 | 190 | 107 | 4 | 6 | 9 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-08 Mon&gt;</span></span> | Apple | 1 | 200 | 104 | 1 | 28 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-08 Mon&gt;</span></span> | Toast with cheese and turkey | 1 | 85 | 128 | 13 | 15 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-08 Mon&gt;</span></span> | Whey protein / Biotech | 1 | 30 | 109 | 26 | 1 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-08 Mon&gt;</span></span> | Banana / Medium | 1 | 63 | 98 | 8 | 1 | 7 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-09 Tue&gt;</span></span> | Bread with egg and cheese | 1 | 123 | 211 | 18 | 18 | 11 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-09 Tue&gt;</span></span> | Yogurt with honey and walnuts | 1 | 234 | 333 | 20 | 22 | 20 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-09 Tue&gt;</span></span> | Cupcake | 2 | 7 | 456 | 7 | 101 | 6 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-09 Tue&gt;</span></span> | Lentil soup | 1 | 300 | 250 | 15 | 36 | 5 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-09 Tue&gt;</span></span> | Tuna / Trata | 1 | 23 | 98 | 23 | 0 | 1 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-09 Tue&gt;</span></span> | Rusk / Manna | 1 | 30 | 124 | 4 | 22 | 3 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-09 Tue&gt;</span></span> | Whey protein / Biotech | 1 | 30 | 109 | 26 | 1 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-09 Tue&gt;</span></span> | Banana / Medium | 1 | 63 | 98 | 8 | 1 | 7 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-09 Tue&gt;</span></span> | Strapatsada | 1 | 489 | 422 | 37 | 14 | 25 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-10 Wed&gt;</span></span> | Tortilla with Banana Honey and Sesame paste | 1 | 112 | 334 | 12 | 38 | 16 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-10 Wed&gt;</span></span> | Swordfish | 2 | 100 | 792 | 100 | 0 | 20 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-10 Wed&gt;</span></span> | Lettuce salad | 2 | 380 | 214 | 8 | 12 | 18 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-10 Wed&gt;</span></span> | Apple | 1 | 200 | 104 | 1 | 28 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-10 Wed&gt;</span></span> | Whey protein / Biotech | 1 | 30 | 109 | 26 | 1 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-10 Wed&gt;</span></span> | Banana / Medium | 1 | 63 | 98 | 8 | 1 | 7 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-10 Wed&gt;</span></span> | Yogurt with honey and walnuts | 1 | 234 | 333 | 20 | 22 | 20 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-11 Thu&gt;</span></span> | Bread / Whole grain | 1 | 30 | 65 | 3 | 13 | 1 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-11 Thu&gt;</span></span> | Honey / Αττική | 1 | 10 | 34 | 0 | 8 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-11 Thu&gt;</span></span> | Sesame paste | 1 | 10 | 63 | 3 | 1 | 6 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-11 Thu&gt;</span></span> | Yogurt with honey and walnuts | 1 | 234 | 333 | 20 | 22 | 20 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-11 Thu&gt;</span></span> | Turkey burgers | 1 | 120 | 165 | 23 | 8 | 5 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-11 Thu&gt;</span></span> | Lettuce salad | 1 | 190 | 107 | 4 | 6 | 9 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-11 Thu&gt;</span></span> | Banana / Medium | 1 | 63 | 98 | 8 | 1 | 7 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-11 Thu&gt;</span></span> | Whey protein / Biotech | 1 | 30 | 109 | 26 | 1 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-11 Thu&gt;</span></span> | Banana / Medium | 1 | 63 | 98 | 8 | 1 | 7 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-11 Thu&gt;</span></span> | Chicken breast | 1 | 120 | 170 | 32 | 4 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-11 Thu&gt;</span></span> | Lettuce salad | 1 | 190 | 107 | 4 | 6 | 9 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-12 Fri&gt;</span></span> | Omelette / Double Egg with cheese | 1 | 156 | 244 | 23 | 6 | 17 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-12 Fri&gt;</span></span> | Yogurt with honey and walnuts | 1 | 234 | 333 | 20 | 22 | 20 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-12 Fri&gt;</span></span> | Turkey burgers | 1 | 120 | 165 | 23 | 8 | 5 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-12 Fri&gt;</span></span> | Lettuce salad | 1 | 190 | 107 | 4 | 6 | 9 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-12 Fri&gt;</span></span> | Banana / Medium | 1 | 63 | 98 | 8 | 1 | 7 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-12 Fri&gt;</span></span> | Whey protein / Biotech | 1 | 30 | 109 | 26 | 1 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-12 Fri&gt;</span></span> | Banana / Medium | 1 | 63 | 98 | 8 | 1 | 7 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-12 Fri&gt;</span></span> | Chicken breast | 1 | 120 | 170 | 32 | 4 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-12 Fri&gt;</span></span> | Lettuce salad | 1 | 190 | 107 | 4 | 6 | 9 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-13 Sat&gt;</span></span> | Tortilla with Banana Peanutbutter and Sesame Paste | 1 | 143 | 405 | 19 | 31 | 23 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-13 Sat&gt;</span></span> | Turkey burgers | 1 | 120 | 165 | 23 | 8 | 5 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-13 Sat&gt;</span></span> | Broccoli | 1 | 100 | 45 | 4 | 8 | 1 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-13 Sat&gt;</span></span> | Yogurt with honey and walnuts | 1 | 234 | 333 | 20 | 22 | 20 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-13 Sat&gt;</span></span> | Banana / Medium | 1 | 63 | 98 | 8 | 1 | 7 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-13 Sat&gt;</span></span> | Turkey burgers | 1 | 120 | 165 | 23 | 8 | 5 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-13 Sat&gt;</span></span> | Lettuce salad | 1 | 190 | 107 | 4 | 6 | 9 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-14 Sun&gt;</span></span> | Bread / Whole grain | 1 | 30 | 65 | 3 | 13 | 1 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-14 Sun&gt;</span></span> | Honey / Αττική | 1 | 10 | 34 | 0 | 8 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-14 Sun&gt;</span></span> | Sesame paste | 1 | 10 | 63 | 3 | 1 | 6 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-14 Sun&gt;</span></span> | Yogurt with honey and walnuts | 1 | 234 | 333 | 20 | 22 | 20 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-14 Sun&gt;</span></span> | Salmon | 1 | 200 | 208 | 46 | 0 | 16 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-14 Sun&gt;</span></span> | Rice | 1 | 150 | 524 | 11 | 117 | 1 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-14 Sun&gt;</span></span> | Lettuce salad | 1 | 190 | 107 | 4 | 6 | 9 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-14 Sun&gt;</span></span> | Tuna / Trata | 1 | 23 | 98 | 23 | 0 | 1 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-14 Sun&gt;</span></span> | Lettuce salad | 1 | 190 | 107 | 4 | 6 | 9 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-14 Sun&gt;</span></span> | Banana / Medium | 1 | 63 | 98 | 8 | 1 | 7 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-16 Tue&gt;</span></span> | Bread / Whole grain | 1 | 30 | 65 | 3 | 13 | 1 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-16 Tue&gt;</span></span> | Honey / Αττική | 1 | 10 | 34 | 0 | 8 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-16 Tue&gt;</span></span> | Peanutbutter | 1 | 10 | 56 | 3 | 1 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-16 Tue&gt;</span></span> | Apple | 1 | 200 | 104 | 1 | 28 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-16 Tue&gt;</span></span> | Turkey burgers | 1 | 120 | 165 | 23 | 8 | 5 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-16 Tue&gt;</span></span> | Lettuce salad | 1 | 190 | 107 | 4 | 6 | 9 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-16 Tue&gt;</span></span> | Whey protein / Biotech | 1 | 30 | 109 | 26 | 1 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-16 Tue&gt;</span></span> | Toast with cheese | 1 | 55 | 107 | 9 | 15 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-16 Tue&gt;</span></span> | Chicken breast | 1 | 120 | 170 | 32 | 4 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-16 Tue&gt;</span></span> | Lettuce salad | 1 | 190 | 107 | 4 | 6 | 9 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-17 Wed&gt;</span></span> | Bread / Whole grain | 1 | 30 | 65 | 3 | 13 | 1 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-17 Wed&gt;</span></span> | Honey / Αττική | 1 | 10 | 34 | 0 | 8 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-17 Wed&gt;</span></span> | Peanutbutter | 1 | 10 | 56 | 3 | 1 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-17 Wed&gt;</span></span> | Toast with cheese and turkey | 1 | 85 | 128 | 13 | 15 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-17 Wed&gt;</span></span> | Oat burgers | 1.5 | 180 | 339 | 26 | 26 | 6 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-17 Wed&gt;</span></span> | Lettuce salad | 1 | 190 | 107 | 4 | 6 | 9 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-17 Wed&gt;</span></span> | Yogurt with honey and walnuts | 1 | 234 | 333 | 20 | 22 | 20 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-17 Wed&gt;</span></span> | Toast with cheese and turkey | 1 | 85 | 128 | 13 | 15 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-17 Wed&gt;</span></span> | Whey protein / Biotech | 1 | 30 | 109 | 26 | 1 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-17 Wed&gt;</span></span> | Lettuce salad | 1 | 190 | 107 | 4 | 6 | 9 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-17 Wed&gt;</span></span> | Oat burgers | 1.5 | 180 | 339 | 26 | 26 | 6 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-18 Thu&gt;</span></span> | Tortilla with Banana Honey and Sesame paste | 1 | 112 | 334 | 12 | 38 | 16 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-18 Thu&gt;</span></span> | Yogurt with honey and walnuts | 1 | 234 | 333 | 20 | 22 | 20 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-18 Thu&gt;</span></span> | Lentil soup | 1 | 300 | 250 | 15 | 36 | 5 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-18 Thu&gt;</span></span> | Tuna / Trata | 1.5 | 35 | 147 | 35 | 0 | 2 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-18 Thu&gt;</span></span> | Digestive bar chocolate chips / Papadopoulou | 1 | 2 | 126 | 2 | 19 | 5 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-18 Thu&gt;</span></span> | Whey protein / Biotech | 1 | 30 | 109 | 26 | 1 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-18 Thu&gt;</span></span> | Toast with cheese and turkey | 1 | 85 | 128 | 13 | 15 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-18 Thu&gt;</span></span> | Strapatsada | 1 | 489 | 422 | 37 | 14 | 25 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-20 Sat&gt;</span></span> | Bread / Whole grain | 1 | 30 | 65 | 3 | 13 | 1 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-20 Sat&gt;</span></span> | Honey / Αττική | 1 | 10 | 34 | 0 | 8 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-20 Sat&gt;</span></span> | Peanutbutter | 1 | 10 | 56 | 3 | 1 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-20 Sat&gt;</span></span> | Pita with chicken suvlaki | 1 | 250 | 412 | 37 | 41 | 10 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-20 Sat&gt;</span></span> | Lettuce salad | 1 | 190 | 107 | 4 | 6 | 9 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-20 Sat&gt;</span></span> | Chicken suvlaki | 2 | 240 | 260 | 68 | 0 | 8 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-20 Sat&gt;</span></span> | Lettuce salad | 1 | 190 | 107 | 4 | 6 | 9 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-20 Sat&gt;</span></span> | Yogurt with honey and walnuts | 2 | 468 | 666 | 40 | 44 | 40 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-21 Sun&gt;</span></span> | Tortilla with Banana Peanutbutter and Sesame Paste | 1 | 143 | 405 | 19 | 31 | 23 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-21 Sun&gt;</span></span> | Yogurt / Light 2 percent | 1 | 200 | 142 | 16 | 11 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-21 Sun&gt;</span></span> | Turkey burgers | 1 | 120 | 165 | 23 | 8 | 5 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-21 Sun&gt;</span></span> | Chicken breast | 1 | 120 | 170 | 32 | 4 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-21 Sun&gt;</span></span> | Lettuce salad | 2 | 380 | 214 | 8 | 12 | 18 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-21 Sun&gt;</span></span> | Toast with cheese and turkey | 1 | 85 | 128 | 13 | 15 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-22 Mon&gt;</span></span> | Omelette / Double egg | 1 | 126 | 196 | 16 | 2 | 14 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-22 Mon&gt;</span></span> | Toast with cheese and turkey | 1 | 85 | 128 | 13 | 15 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-22 Mon&gt;</span></span> | Spaghetti / Whole grain | 1 | 210 | 736 | 27 | 138 | 5 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-22 Mon&gt;</span></span> | Lettuce salad | 1 | 190 | 107 | 4 | 6 | 9 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-22 Mon&gt;</span></span> | Whey protein / Biotech | 1 | 30 | 109 | 26 | 1 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-22 Mon&gt;</span></span> | Banana / Medium | 1 | 63 | 98 | 8 | 1 | 7 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-22 Mon&gt;</span></span> | Omelette / Double Egg and eggwhite | 1 | 186 | 226 | 23 | 2 | 14 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-23 Tue&gt;</span></span> | Omelette / Double egg | 1 | 126 | 196 | 16 | 2 | 14 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-23 Tue&gt;</span></span> | Yogurt / Light 2 percent | 1 | 200 | 142 | 16 | 11 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-23 Tue&gt;</span></span> | Swordfish | 2 | 100 | 792 | 100 | 0 | 20 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-23 Tue&gt;</span></span> | Lettuce salad | 2 | 380 | 214 | 8 | 12 | 18 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-23 Tue&gt;</span></span> | Quinoa / Red | 1 | 190 | 669 | 27 | 108 | 12 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-23 Tue&gt;</span></span> | Whey protein / Biotech | 1 | 30 | 109 | 26 | 1 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-23 Tue&gt;</span></span> | Banana / Medium | 1 | 63 | 98 | 8 | 1 | 7 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-24 Wed&gt;</span></span> | Bread / Whole grain | 1 | 30 | 65 | 3 | 13 | 1 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-24 Wed&gt;</span></span> | Honey / Αττική | 1 | 10 | 34 | 0 | 8 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-24 Wed&gt;</span></span> | Peanutbutter | 1 | 10 | 56 | 3 | 1 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-25 Thu&gt;</span></span> | Tortilla with Banana Honey and Sesame paste | 1 | 112 | 334 | 12 | 38 | 16 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-25 Thu&gt;</span></span> | Yogurt with honey and walnuts | 1 | 234 | 333 | 20 | 22 | 20 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-25 Thu&gt;</span></span> | Pork steak | 2 | 240 | 604 | 64 | 0 | 22 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-25 Thu&gt;</span></span> | Lettuce salad | 2 | 380 | 214 | 8 | 12 | 18 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-25 Thu&gt;</span></span> | Whey protein / Biotech | 1 | 30 | 109 | 26 | 1 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-25 Thu&gt;</span></span> | Banana / Medium | 1 | 63 | 98 | 8 | 1 | 7 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-25 Thu&gt;</span></span> | Quinoa / Red | 1 | 190 | 669 | 27 | 108 | 12 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-26 Fri&gt;</span></span> | Bread / Whole grain | 1 | 30 | 65 | 3 | 13 | 1 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-26 Fri&gt;</span></span> | Honey / Αττική | 1 | 10 | 34 | 0 | 8 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-26 Fri&gt;</span></span> | Peanutbutter | 1 | 10 | 56 | 3 | 1 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-26 Fri&gt;</span></span> | Chicken suvlaki | 1 | 120 | 130 | 34 | 0 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-26 Fri&gt;</span></span> | Lettuce salad | 1 | 190 | 107 | 4 | 6 | 9 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-26 Fri&gt;</span></span> | Chicken suvlaki | 1 | 120 | 130 | 34 | 0 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-26 Fri&gt;</span></span> | Lettuce salad | 1 | 190 | 107 | 4 | 6 | 9 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-26 Fri&gt;</span></span> | Yogurt with honey and walnuts | 2 | 468 | 666 | 40 | 44 | 40 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-26 Fri&gt;</span></span> | Whey protein / Biotech | 1 | 30 | 109 | 26 | 1 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-26 Fri&gt;</span></span> | Banana / Medium | 1 | 63 | 98 | 8 | 1 | 7 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-27 Sat&gt;</span></span> | Omelette / Double egg | 1 | 126 | 196 | 16 | 2 | 14 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-27 Sat&gt;</span></span> | Yogurt light with Whey | 1 | 208 | 170 | 23 | 12 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-27 Sat&gt;</span></span> | Pita with chicken suvlaki | 1 | 250 | 412 | 37 | 41 | 10 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-27 Sat&gt;</span></span> | Lettuce salad | 2 | 380 | 214 | 8 | 12 | 18 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-27 Sat&gt;</span></span> | Chicken breast | 1 | 120 | 170 | 32 | 4 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-27 Sat&gt;</span></span> | Toast with cheese and turkey | 1 | 85 | 128 | 13 | 15 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-27 Sat&gt;</span></span> | Bread / Whole grain | 1 | 30 | 65 | 3 | 13 | 1 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-28 Sun&gt;</span></span> | Omelette / Double egg | 1 | 126 | 196 | 16 | 2 | 14 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-28 Sun&gt;</span></span> | Yogurt light with Whey | 1 | 208 | 170 | 23 | 12 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-28 Sun&gt;</span></span> | Salmon | 1 | 200 | 208 | 46 | 0 | 16 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-28 Sun&gt;</span></span> | Rice | 1 | 150 | 524 | 11 | 117 | 1 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-28 Sun&gt;</span></span> | Cabbage and carrot salad | 1 | 190 | 130 | 4 | 13 | 10 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-28 Sun&gt;</span></span> | Banana / Medium | 1 | 63 | 98 | 8 | 1 | 7 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-28 Sun&gt;</span></span> | Strapatsada | 1 | 489 | 422 | 37 | 14 | 25 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-03 Sat&gt;</span></span> | Bread / Whole grain | 1 | 30 | 65 | 3 | 13 | 1 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-03 Sat&gt;</span></span> | Honey / Αττική | 1 | 10 | 34 | 0 | 8 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-03 Sat&gt;</span></span> | Sesame paste | 1 | 10 | 63 | 3 | 1 | 6 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-03 Sat&gt;</span></span> | Banana / Medium | 1 | 63 | 98 | 8 | 1 | 7 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-03 Sat&gt;</span></span> | Mushroom Risoto | 1 | 300 | 367 | 8 | 53 | 15 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-03 Sat&gt;</span></span> | Spinach and rucola salad | 1 | 210 | 141 | 7 | 8 | 10 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-03 Sat&gt;</span></span> | Whey protein / Biotech | 1 | 30 | 109 | 26 | 1 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-03 Sat&gt;</span></span> | Banana / Medium | 1 | 63 | 98 | 8 | 1 | 7 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-03 Sat&gt;</span></span> | Salmon | 1 | 200 | 208 | 46 | 0 | 16 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-03 Sat&gt;</span></span> | Broccoli salad | 1 | 110 | 127 | 5 | 9 | 10 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-04 Sun&gt;</span></span> | Tortilla with Banana Peanutbutter and Sesame Paste | 1 | 143 | 405 | 19 | 31 | 23 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-04 Sun&gt;</span></span> | Apple | 1 | 200 | 104 | 1 | 28 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-04 Sun&gt;</span></span> | Pita with chicken suvlaki | 1 | 250 | 412 | 37 | 41 | 10 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-04 Sun&gt;</span></span> | Lettuce salad | 1 | 190 | 107 | 4 | 6 | 9 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-04 Sun&gt;</span></span> | Chicken breast | 1 | 120 | 170 | 32 | 4 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-04 Sun&gt;</span></span> | Lettuce salad | 1 | 190 | 107 | 4 | 6 | 9 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-05 Mon&gt;</span></span> | Tortilla with Banana Peanutbutter and Sesame Paste | 1 | 143 | 405 | 19 | 31 | 23 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-05 Mon&gt;</span></span> | Omelette / Double egg | 1 | 126 | 196 | 16 | 2 | 14 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-05 Mon&gt;</span></span> | Apple | 1 | 200 | 104 | 1 | 28 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-05 Mon&gt;</span></span> | Chicken breast with brown rice | 1 | 270 | 620 | 41 | 100 | 3 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-05 Mon&gt;</span></span> | Lettuce salad | 1 | 190 | 107 | 4 | 6 | 9 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-05 Mon&gt;</span></span> | Whey protein / Biotech | 1 | 30 | 109 | 26 | 1 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-05 Mon&gt;</span></span> | Toast with cheese and turkey | 1 | 85 | 128 | 13 | 15 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-05 Mon&gt;</span></span> | Chicken breast | 1 | 120 | 170 | 32 | 4 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-05 Mon&gt;</span></span> | Lettuce salad | 1 | 190 | 107 | 4 | 6 | 9 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-07 Wed&gt;</span></span> | Bread / Whole grain | 1 | 30 | 65 | 3 | 13 | 1 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-07 Wed&gt;</span></span> | Honey / Αττική | 1 | 10 | 34 | 0 | 8 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-07 Wed&gt;</span></span> | Peanutbutter | 1 | 10 | 56 | 3 | 1 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-07 Wed&gt;</span></span> | Yogurt light with Whey | 1 | 208 | 170 | 23 | 12 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-07 Wed&gt;</span></span> | Bean soup | 1 | 300 | 396 | 26 | 71 | 2 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-07 Wed&gt;</span></span> | Egg | 2 | 126 | 196 | 16 | 2 | 14 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-07 Wed&gt;</span></span> | Strapatsada | 1 | 489 | 422 | 37 | 14 | 25 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-07 Wed&gt;</span></span> | Apple | 1 | 200 | 104 | 1 | 28 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-08 Thu&gt;</span></span> | Tortilla with Banana Peanutbutter and Sesame Paste | 1 | 143 | 405 | 19 | 31 | 23 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-08 Thu&gt;</span></span> | Beef steak | 2 | 240 | 562 | 62 | 0 | 32 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-08 Thu&gt;</span></span> | Lettuce salad | 2 | 380 | 214 | 8 | 12 | 18 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-08 Thu&gt;</span></span> | Whey protein / Biotech | 1 | 30 | 109 | 26 | 1 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-08 Thu&gt;</span></span> | Banana / Medium | 1 | 63 | 98 | 8 | 1 | 7 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-08 Thu&gt;</span></span> | Apple | 1 | 200 | 104 | 1 | 28 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-09 Fri&gt;</span></span> | Tortilla with Banana Peanutbutter and Sesame Paste | 1 | 143 | 405 | 19 | 31 | 23 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-09 Fri&gt;</span></span> | Chicken breast with rice | 1 | 270 | 694 | 43 | 121 | 1 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-09 Fri&gt;</span></span> | Apple | 1 | 200 | 104 | 1 | 28 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-09 Fri&gt;</span></span> | Yogurt light with Whey | 1 | 208 | 170 | 23 | 12 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-09 Fri&gt;</span></span> | Chicken breast | 1 | 120 | 170 | 32 | 4 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-09 Fri&gt;</span></span> | Lettuce salad | 2 | 380 | 214 | 8 | 12 | 18 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-10 Sat&gt;</span></span> | Omelette / Double egg | 1 | 126 | 196 | 16 | 2 | 14 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-10 Sat&gt;</span></span> | Yogurt light with Whey | 1 | 208 | 170 | 23 | 12 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-10 Sat&gt;</span></span> | Oat burgers | 2 | 240 | 452 | 34 | 34 | 8 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-10 Sat&gt;</span></span> | Lettuce salad | 2 | 380 | 214 | 8 | 12 | 18 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-10 Sat&gt;</span></span> | Whey protein / Biotech | 1 | 30 | 109 | 26 | 1 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-10 Sat&gt;</span></span> | Banana / Medium | 1 | 63 | 98 | 8 | 1 | 7 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-11 Sun&gt;</span></span> | Bread with honey and sesame paste | 1 | 50 | 162 | 6 | 22 | 7 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-11 Sun&gt;</span></span> | Banana / Medium | 1 | 63 | 98 | 8 | 1 | 7 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-11 Sun&gt;</span></span> | Pita with chicken suvlaki | 1 | 250 | 412 | 37 | 41 | 10 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-11 Sun&gt;</span></span> | Spinach and rucola salad | 1 | 210 | 141 | 7 | 8 | 10 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-11 Sun&gt;</span></span> | Chicken suvlaki | 1 | 120 | 130 | 34 | 0 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-11 Sun&gt;</span></span> | Spinach and rucola salad | 1 | 210 | 141 | 7 | 8 | 10 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-11 Sun&gt;</span></span> | Whey protein / Biotech | 1 | 30 | 109 | 26 | 1 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-12 Mon&gt;</span></span> | Tortilla with Banana Peanutbutter and Sesame Paste | 1 | 143 | 405 | 19 | 31 | 23 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-12 Mon&gt;</span></span> | Toast / Whole grain with Cheese and Turkey | 1 | 90 | 134 | 14 | 17 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-12 Mon&gt;</span></span> | Lentil soup | 1 | 300 | 250 | 15 | 36 | 5 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-12 Mon&gt;</span></span> | Egg | 2 | 126 | 196 | 16 | 2 | 14 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-12 Mon&gt;</span></span> | Whey protein / Biotech | 1 | 30 | 109 | 26 | 1 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-12 Mon&gt;</span></span> | Banana / Medium | 1 | 63 | 98 | 8 | 1 | 7 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-12 Mon&gt;</span></span> | Strapatsada | 1 | 489 | 422 | 37 | 14 | 25 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-13 Tue&gt;</span></span> | Bread with honey and sesame paste | 1 | 50 | 162 | 6 | 22 | 7 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-13 Tue&gt;</span></span> | Chicken breast with rice | 1 | 270 | 694 | 43 | 121 | 1 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-13 Tue&gt;</span></span> | Apple | 1 | 200 | 104 | 1 | 28 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-13 Tue&gt;</span></span> | Whey protein / Biotech | 1 | 30 | 109 | 26 | 1 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-13 Tue&gt;</span></span> | Banana / Medium | 1 | 63 | 98 | 8 | 1 | 7 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-13 Tue&gt;</span></span> | Chicken breast | 1 | 120 | 170 | 32 | 4 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-13 Tue&gt;</span></span> | Tortilla / El Sabor | 1 | 60 | 188 | 5 | 28 | 6 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-13 Tue&gt;</span></span> | Toast cheese / Milner light | 2 | 60 | 96 | 14 | 8 | 6 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-14 Wed&gt;</span></span> | Tortilla with Banana Peanutbutter and Sesame Paste | 1 | 143 | 405 | 19 | 31 | 23 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-14 Wed&gt;</span></span> | Lettuce salad | 2 | 380 | 214 | 8 | 12 | 18 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-15 Thu&gt;</span></span> | Yogurt light with Whey | 1 | 208 | 170 | 23 | 12 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-15 Thu&gt;</span></span> | Swordfish | 2 | 100 | 792 | 100 | 0 | 20 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-15 Thu&gt;</span></span> | Rice | 1 | 150 | 524 | 11 | 117 | 1 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-16 Fri&gt;</span></span> | Tortilla with Banana Honey and Sesame paste | 1 | 112 | 334 | 12 | 38 | 16 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-16 Fri&gt;</span></span> | Apple | 1 | 200 | 104 | 1 | 28 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-16 Fri&gt;</span></span> | Chicken breast | 2 | 240 | 340 | 64 | 8 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-16 Fri&gt;</span></span> | Lettuce salad | 2 | 380 | 214 | 8 | 12 | 18 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-16 Fri&gt;</span></span> | Yogurt with honey and walnuts | 1 | 234 | 333 | 20 | 22 | 20 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-17 Sat&gt;</span></span> | Omelette / Double egg | 1 | 126 | 196 | 16 | 2 | 14 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-17 Sat&gt;</span></span> | Yogurt light with Whey | 1 | 208 | 170 | 23 | 12 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-17 Sat&gt;</span></span> | Oat burgers | 2 | 240 | 452 | 34 | 34 | 8 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-17 Sat&gt;</span></span> | Lettuce salad | 2 | 380 | 214 | 8 | 12 | 18 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-17 Sat&gt;</span></span> | Apple | 1 | 200 | 104 | 1 | 28 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-19 Mon&gt;</span></span> | Omelette / Double egg | 1 | 126 | 196 | 16 | 2 | 14 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-19 Mon&gt;</span></span> | Apple | 1 | 200 | 104 | 1 | 28 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-19 Mon&gt;</span></span> | Lentil soup | 1 | 300 | 250 | 15 | 36 | 5 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-19 Mon&gt;</span></span> | Tuna / Trata | 1 | 23 | 98 | 23 | 0 | 1 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-19 Mon&gt;</span></span> | Whey protein / Biotech | 1 | 30 | 109 | 26 | 1 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-19 Mon&gt;</span></span> | Banana / Medium | 2 | 126 | 196 | 16 | 2 | 14 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-19 Mon&gt;</span></span> | Strapatsada | 1 | 489 | 422 | 37 | 14 | 25 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-20 Tue&gt;</span></span> | Tortilla with Banana Peanutbutter and Sesame Paste | 1 | 143 | 405 | 19 | 31 | 23 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-20 Tue&gt;</span></span> | Lemon sauce calf | 1 | 150 | 408 | 37 | 1 | 28 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-20 Tue&gt;</span></span> | Lettuce salad | 2 | 380 | 214 | 8 | 12 | 18 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-20 Tue&gt;</span></span> | Oat burgers | 1 | 120 | 226 | 17 | 17 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-20 Tue&gt;</span></span> | Yogurt with honey and walnuts | 1 | 234 | 333 | 20 | 22 | 20 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-20 Tue&gt;</span></span> | Toast with cheese and turkey | 1 | 85 | 128 | 13 | 15 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-21 Wed&gt;</span></span> | Tortilla with Banana Peanutbutter and Sesame Paste | 1 | 143 | 405 | 19 | 31 | 23 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-21 Wed&gt;</span></span> | Banana / Medium | 1 | 63 | 98 | 8 | 1 | 7 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-21 Wed&gt;</span></span> | Whey protein / Biotech | 1 | 30 | 109 | 26 | 1 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-21 Wed&gt;</span></span> | Bean soup | 1 | 300 | 396 | 26 | 71 | 2 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-21 Wed&gt;</span></span> | Rusk / Manna | 1 | 30 | 124 | 4 | 22 | 3 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-21 Wed&gt;</span></span> | Cottage Cheese / Light 4% | 1 | 100 | 92 | 11 | 3 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-24 Sat&gt;</span></span> | Tortilla with strawberries, honey and sesame paste | 1 | 160 | 311 | 9 | 44 | 13 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-24 Sat&gt;</span></span> | Mushroom Risoto | 1 | 300 | 367 | 8 | 53 | 15 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-24 Sat&gt;</span></span> | Chicken suvlaki | 2 | 240 | 260 | 68 | 0 | 8 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-24 Sat&gt;</span></span> | Yogurt light with Whey | 1 | 208 | 170 | 23 | 12 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-24 Sat&gt;</span></span> | Tortilla with cheese and turkey | 1 | 120 | 257 | 16 | 32 | 9 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-25 Sun&gt;</span></span> | Tortilla with strawberries, honey and sesame paste | 1 | 160 | 311 | 9 | 44 | 13 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-25 Sun&gt;</span></span> | Yogurt light with Whey | 1 | 208 | 170 | 23 | 12 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-25 Sun&gt;</span></span> | Salmon | 1 | 200 | 208 | 46 | 0 | 16 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-25 Sun&gt;</span></span> | Spinach and rucola salad | 1 | 210 | 141 | 7 | 8 | 10 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-25 Sun&gt;</span></span> | Tomato salad / Ntakos | 1 | 676 | 543 | 36 | 57 | 23 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-25 Sun&gt;</span></span> | Apple | 1 | 200 | 104 | 1 | 28 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-28 Wed&gt;</span></span> | Tortilla with strawberries, honey and sesame paste | 1 | 160 | 311 | 9 | 44 | 13 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-28 Wed&gt;</span></span> | Yogurt light with Whey | 1 | 208 | 170 | 23 | 12 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-28 Wed&gt;</span></span> | Lentil soup | 1 | 300 | 250 | 15 | 36 | 5 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-28 Wed&gt;</span></span> | Tuna / Trata | 1 | 23 | 98 | 23 | 0 | 1 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-28 Wed&gt;</span></span> | Yogurt light with Whey | 1 | 208 | 170 | 23 | 12 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-28 Wed&gt;</span></span> | Strapatsada | 1 | 489 | 422 | 37 | 14 | 25 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-29 Thu&gt;</span></span> | Tortilla with strawberries, honey and sesame paste | 1 | 160 | 311 | 9 | 44 | 13 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-29 Thu&gt;</span></span> | Yogurt light with Whey | 1 | 208 | 170 | 23 | 12 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-29 Thu&gt;</span></span> | Spinach Rice | 1 | 300 | 249 | 13 | 51 | 2 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-29 Thu&gt;</span></span> | Tuna / Trata | 1 | 23 | 98 | 23 | 0 | 1 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-29 Thu&gt;</span></span> | Whey protein / Biotech | 1 | 30 | 109 | 26 | 1 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-29 Thu&gt;</span></span> | Pear | 1 | 0 | 58 | 0 | 15 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-05-06 Thu&gt;</span></span> | Bread with honey and sesame paste | 1 | 50 | 162 | 6 | 22 | 7 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-05-17 Mon&gt;</span></span> | Tortilla with strawberries, honey and sesame paste | 1 | 160 | 311 | 9 | 44 | 13 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-05-31 Mon&gt;</span></span> | Tortilla with strawberries, honey and sesame paste | 1 | 160 | 311 | 9 | 44 | 13 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-06-07 Mon&gt;</span></span> | Tortilla with honey, peanutbutter, banana and walnuts | 1 | 194 | 506 | 22 | 64 | 26 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-06-09 Wed&gt;</span></span> | Tortilla with strawberries, honey and sesame paste | 1 | 160 | 311 | 9 | 44 | 13 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-06-09 Wed&gt;</span></span> | Whey protein / Biotech | 1 | 30 | 109 | 26 | 1 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-06-09 Wed&gt;</span></span> | Seam beam | 2 | 400 | 734 | 94 | 0 | 40 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-06-09 Wed&gt;</span></span> | Apple | 1 | 200 | 104 | 1 | 28 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-06-09 Wed&gt;</span></span> | Lettuce salad | 2 | 380 | 214 | 8 | 12 | 18 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-06-09 Wed&gt;</span></span> | Rice | 1 | 150 | 524 | 11 | 117 | 1 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-06-09 Wed&gt;</span></span> | Yogurt light with Whey | 1 | 208 | 170 | 23 | 12 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-06-10 Thu&gt;</span></span> | Tortilla with strawberries, honey and sesame paste | 1 | 160 | 311 | 9 | 44 | 13 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-06-24 Thu&gt;</span></span> | Omelette / Tripple eggwhites oat and light cheese | 1 | 126 | 108 | 20 | 8 | 3 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-06-24 Thu&gt;</span></span> | Fasolakia with Cottage light | 1 | 450 | 218 | 17 | 32 | 5 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-06-24 Thu&gt;</span></span> | Tomato salad / Ntakos | 1 | 676 | 543 | 36 | 57 | 23 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-06-24 Thu&gt;</span></span> | Whey protein / Biotech | 1 | 30 | 109 | 26 | 1 | 0 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-06-24 Thu&gt;</span></span> | Banana / Medium | 1 | 63 | 98 | 8 | 1 | 7 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-06-24 Thu&gt;</span></span> | Yogurt light with Whey | 1 | 208 | 170 | 23 | 12 | 4 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-06-25 Fri&gt;</span></span> | Omelette / Double eggwhite oat and cheese light | 1 | 66 | 78 | 12 | 8 | 3 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-06-29 Tue&gt;</span></span> | Omelette / Tripple eggwhites oat and light cheese | 1 | 126 | 108 | 20 | 8 | 3 |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-06-29 Tue&gt;</span></span> | Turkey | 1 | 30 | 21 | 4 | 0 | 0 |


### Daily aggregate {#daily-aggregate}

The meals table contains row per meal. It's desirable to have row per day.
The table below is generated automatically, so that it sum all values per day.
Also, its plotted.

| DATE                                                                                         | vsum(CALORIES) | vsum(PROTEIN) | vsum(CARBS) | vsum(FAT) |
|----------------------------------------------------------------------------------------------|----------------|---------------|-------------|-----------|
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-22 Mon&gt;</span></span> | 2051           | 93            | 250         | 64        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-23 Tue&gt;</span></span> | 2173           | 145           | 308         | 40        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-24 Wed&gt;</span></span> | 1766           | 147           | 178         | 59        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-25 Thu&gt;</span></span> | 1390           | 86            | 127         | 56        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-26 Fri&gt;</span></span> | 1768           | 140           | 119         | 89        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-27 Sat&gt;</span></span> | 1625           | 137           | 122         | 72        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-02-28 Sun&gt;</span></span> | 1658           | 108           | 203         | 44        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-01 Mon&gt;</span></span> | 1330           | 128           | 119         | 40        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-02 Tue&gt;</span></span> | 1364           | 143           | 89          | 53        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-03 Wed&gt;</span></span> | 1669           | 153           | 55          | 104       |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-04 Thu&gt;</span></span> | 1841           | 126           | 98          | 104       |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-05 Fri&gt;</span></span> | 1164           | 74            | 125         | 38        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-06 Sat&gt;</span></span> | 2362           | 103           | 170         | 106       |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-07 Sun&gt;</span></span> | 1728           | 135           | 123         | 68        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-08 Mon&gt;</span></span> | 1460           | 100           | 158         | 44        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-09 Tue&gt;</span></span> | 2101           | 158           | 215         | 78        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-10 Wed&gt;</span></span> | 1984           | 175           | 102         | 81        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-11 Thu&gt;</span></span> | 1349           | 131           | 71          | 64        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-12 Fri&gt;</span></span> | 1431           | 148           | 55          | 74        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-13 Sat&gt;</span></span> | 1318           | 101           | 84          | 70        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-14 Sun&gt;</span></span> | 1637           | 122           | 174         | 70        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-16 Tue&gt;</span></span> | 1024           | 105           | 90          | 32        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-17 Wed&gt;</span></span> | 1745           | 138           | 139         | 63        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-18 Thu&gt;</span></span> | 1849           | 160           | 145         | 77        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-20 Sat&gt;</span></span> | 1707           | 159           | 119         | 81        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-21 Sun&gt;</span></span> | 1224           | 111           | 81          | 54        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-22 Mon&gt;</span></span> | 1600           | 117           | 165         | 53        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-23 Tue&gt;</span></span> | 2220           | 201           | 135         | 75        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-24 Wed&gt;</span></span> | 155            | 6             | 22          | 5         |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-25 Thu&gt;</span></span> | 2361           | 165           | 182         | 95        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-26 Fri&gt;</span></span> | 1502           | 156           | 80          | 78        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-27 Sat&gt;</span></span> | 1355           | 132           | 99          | 51        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-03-28 Sun&gt;</span></span> | 1748           | 145           | 159         | 77        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-03 Sat&gt;</span></span> | 1310           | 114           | 95          | 72        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-04 Sun&gt;</span></span> | 1305           | 97            | 116         | 51        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-05 Mon&gt;</span></span> | 1946           | 156           | 193         | 62        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-07 Wed&gt;</span></span> | 1443           | 109           | 149         | 50        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-08 Thu&gt;</span></span> | 1492           | 124           | 73          | 80        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-09 Fri&gt;</span></span> | 1757           | 126           | 208         | 46        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-10 Sat&gt;</span></span> | 1239           | 115           | 62          | 51        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-11 Sun&gt;</span></span> | 1193           | 125           | 81          | 48        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-12 Mon&gt;</span></span> | 1614           | 135           | 102         | 78        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-13 Tue&gt;</span></span> | 1621           | 135           | 213         | 27        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-14 Wed&gt;</span></span> | 619            | 27            | 43          | 41        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-15 Thu&gt;</span></span> | 1486           | 134           | 129         | 25        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-16 Fri&gt;</span></span> | 1325           | 105           | 108         | 54        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-17 Sat&gt;</span></span> | 1136           | 82            | 88          | 44        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-19 Mon&gt;</span></span> | 1375           | 134           | 83          | 59        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-20 Tue&gt;</span></span> | 1714           | 114           | 98          | 97        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-21 Wed&gt;</span></span> | 1224           | 94            | 129         | 39        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-24 Sat&gt;</span></span> | 1365           | 124           | 141         | 49        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-25 Sun&gt;</span></span> | 1477           | 122           | 149         | 66        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-28 Wed&gt;</span></span> | 1421           | 130           | 118         | 52        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-04-29 Thu&gt;</span></span> | 995            | 94            | 123         | 20        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-05-06 Thu&gt;</span></span> | 162            | 6             | 22          | 7         |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-05-17 Mon&gt;</span></span> | 311            | 9             | 44          | 13        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-05-31 Mon&gt;</span></span> | 311            | 9             | 44          | 13        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-06-07 Mon&gt;</span></span> | 506            | 22            | 64          | 26        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-06-09 Wed&gt;</span></span> | 2166           | 172           | 214         | 76        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-06-10 Thu&gt;</span></span> | 311            | 9             | 44          | 13        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-06-24 Thu&gt;</span></span> | 1246           | 130           | 111         | 42        |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-06-25 Fri&gt;</span></span> | 78             | 12            | 8           | 3         |
| <span class="timestamp-wrapper"><span class="timestamp">&lt;2021-06-29 Tue&gt;</span></span> | 129            | 24            | 8           | 3         |
