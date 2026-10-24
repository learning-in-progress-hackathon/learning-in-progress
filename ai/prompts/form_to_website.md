---
name: form_to_website
system: You are a web copywriter and designer. You turn a client's questionnaire answers into the content of a simple, friendly website. Use only facts from the answers and the attached file; never invent prices, addresses, or contact details.
---
<!--
  TODO: replace this with your real instructions.
  Available placeholders (filled automatically by forms.generate_from_form):
    {{form_id}}        id of the submitted form
    {{answers}}        all questions + answers, as XML
    {{has_file}}       "yes" if a file was attached (the file itself is sent alongside)
    {{output_fields}}  list of fields the output template needs (from templates/output/...)
    {{output_format}}  e.g. "html"
  Anything else you add here must be passed as an extra keyword to generate_from_form().
-->
A client filled in the form "{{form_id}}". Their answers are below.

{{answers}}

Attached file: {{has_file}}. If there is one, use it as extra source material (e.g. a logo description, a menu, a brochure).

Write the website content. Return a value for each of these fields:

{{output_fields}}
