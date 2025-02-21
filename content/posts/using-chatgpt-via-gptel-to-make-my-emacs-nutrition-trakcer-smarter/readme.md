+++
title = "Using ChatGPT via gptel to make my Emacs nutrition tracker smarter"
author = ["Ioannis Canellos"]
date = 2025-02-16T09:19:00+03:00
draft = false
categories = ["emacs"]
tags = ["emacs", "chatgpt", "gptel", "ai", "nutrition tracker"]
+++

## Using ChatGPT via gptel to make my Emacs nutrition tracker smarter {#using-chatgpt-via-gptel-to-make-my-emacs-nutrition-tracker-smarter}



### Introduction {#introduction}

Back in April 2020 I shared how I built a nutrition tracker in Emacs that leveraged org-capture templates and or-ql to record foods, recipes, and meals.
At that time, I relied on an org-mode based database and manual updates to keep track of calories, protein, carbs, and fat. While the system worked, maintaining that data was both tedious and error-prone.
Each time I needed to insert a new food, I had to do an internet search to find the nutritional information and then manually update my org-mode files.

Recently, I discovered [gptel](https://github.com/karthink/gptel) which allows Emacs users to easily integrate with ChatGPT or other LLMs. So, I couldn't resist the opportunity to use it to smarten up nutrition tracker by integrating it with LLMs so that it can fetch nutritional information for me.
The goal is to retain the previously used templates, but add a post processing mechanism that will kick in when a new food entry is captured but is missing the nuttritional information.

A video walkthrough that walks through the this post can be found here:

{{< youtube Kvl5XKppwrk >}}


### Creating a function to get nutritional information from ChatGPT {#creating-a-function-to-get-nutritional-information-from-chatgpt}

The first thing that we are going to need is a new function that given a food and its quantity, will query ChatGPT via GPTel for all nutrients in a FOOD item with a given QUANTITY. The function will return a map of nutrients to their values.

```emacs-lisp
(defun ic/nutrients-get (food quantity)
  "Query ChatGPT via GPTel for all nutrients in a FOOD item with a given QUANTITY.
Returns a map of nutrients to their values."
  (if (or (not food) (string-empty-p food))
      (make-hash-table) ;; Return an empty map if food is nil or empty
    (let* ((quantity (or quantity "1 serving"))
           (prompt (format "Provide the nutritional values (calories, protein, carbs, fat) for %s in %s. Only return a JSON object with the keys 'calories', 'protein', 'carbs', and 'fat', and their numeric values." food quantity))
           (response (if (fboundp 'gptel-request)
                         (let ((response ""))
                           (gptel-request prompt :callback (lambda (resp &rest _)
                                                             (setq response (replace-regexp-in-string "^```json\\|```$" "" resp))
                                                             (message "Response: %s" response)))
                           (while (string-empty-p response)
                             (sleep-for 0.1))
                           response)
                       "{}")))
      (condition-case nil
          (json-read-from-string response)
        (error (progn
                 (message "Error parsing JSON response")
                 nil))))))
```

Next stop is to create a function that goes to the current org-mode heading, calls the function above to get the nutrients, and then updates the properties of the heading with the nutritional information.


### Creating a function that post processes captured food entries {#creating-a-function-that-post-processes-captured-food-entries}

```emacs-lisp
(defun ic/post-process-nutrition-food-entry ()
  "Calculate nutrition values for the last captured Org entry and update the table.
Only query for nutrients if user input is blank."
  (save-excursion
    ;; Safely check for heading. If there's no heading, do nothing.
    (condition-case nil
        (progn
          (org-back-to-heading t) ; throws an error if no heading above point
          (let* ((food (org-get-heading t t t t)) ;; Dynamically get the heading as the food name
                 (unit (or (org-entry-get nil "UNIT") "unit"))  ;; Default to "unit"
                 (quantity (or (org-entry-get nil "QUANTITY") "1")) ;; Default to "1"
                 (nutrients (ic/nutrients-get food (format "%s %s" quantity unit)))
                 (calories
                  (or (ic/string-trim (org-entry-get nil "CALORIES"))
                      (format "%s" (alist-get 'calories nutrients))))
                 (protein
                  (or (ic/string-trim (org-entry-get nil "PROTEIN"))
                      (format "%s" (alist-get 'protein nutrients))))
                 (carbs
                  (or (ic/string-trim (org-entry-get nil "CARBS"))
                      (format "%s" (alist-get 'carbs nutrients))))
                 (fat
                  (or (ic/string-trim (org-entry-get nil "FAT"))
                      (format "%s" (alist-get 'fat nutrients)))))

            ;; Log debug information for troubleshooting
            (message "%s" (prin1-to-string nutrients))
            (message "Setting properties: calories: %s, protein: %s, carbs: %s, fat: %s"
                     calories protein carbs fat)

            ;; Update properties
            (when calories (org-set-property "CALORIES" calories))
            (when protein (org-set-property "PROTEIN" protein))
            (when carbs (org-set-property "CARBS" carbs))
            (when fat (org-set-property "FAT" fat))

            ;; Update the table below the entry
            (let ((found-table (re-search-forward "TBLNAME" nil t)))
              (if found-table
                  (progn
                    (message "Table found, updating values...")
                    (org-table-goto-line 2)
                    (org-table-put 2 4 (or quantity "1")) ;; Update quantity
                    (org-table-put 2 5 (or calories "0")) ;; Update calories
                    (org-table-put 2 6 (or protein "0"))  ;; Update protein
                    (org-table-put 2 7 (or carbs "0"))    ;; Update carbs
                    (org-table-put 2 8 (or fat "0"))      ;; Update fat
                    (org-table-recalculate 'all)
                    (org-table-align))
                (message "No table found below entry.")))))

      ;; If `org-back-to-heading` fails, we skip the whole update.
      (error (message "No heading found; skipping nutrition update.")))))
```


### Registering the post processing function as an org-capture hook {#registering-the-post-processing-function-as-an-org-capture-hook}

The final step is to add a hook that will call the function above before finalizing the capture process.

```emacs-lisp
  (add-hook 'org-capture-before-finalize-hook #'ic/post-process-nutrition-food-entry)
```


### Conclusion {#conclusion}

Org-Mode is a really powerful tool that can be used in countless ways.
Combining Org-Mode with LLMs can further enhance the capabilities of Org-Mode.

The functionality added in this demo would be really hard to implement without an LLM, as we would have to:

-   Find an online source for nutritional information (that exposes an API)
-   Find a way to 100% match user input with names in the online source (e.g. handling synonyms, typos, etc.)
-   Find a way to parse the response from the online source and deal with inconsistencies missing data etc.

Using an LLM as to abstract the source and the way we interact with it, we allows us to focus on the core functionality, and not on the intricacies of the data source.
[Gptel](https://github.com/karthink/gptel) is a great package that allows us to interact with LLMs from within Emacs, either directly or as libray as demonstrated in this post.

As always, I hop you found this inspiring!
