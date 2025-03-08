# Item Comparison Form
## Description
This script provides a customizable form to select items from a list and then load a template using those items as parameters.
The list menu is defined as a template, and the form layout can be customized. **Experimental (wip)**

The script was intended to be used to create stat comparison tables, but it can be used to embed an arbitrary template expansion into a page after the initial page load.

## Usage
To create a form, add the `item-comparison-form` class to an element. The form's type is specified using the `data-form-type` attribute. At the moment only `data-form-type="duplicate"` is supported. The minimum and maximum number of fields is specified using the `data-min-fields` attribute and `data-max-fields` attribute. At the moment only the minimum number of fields is used, because the ability to add or remove fields after loading has not been implemented.

In the form, there can be multiple fields specified, and with the duplicate form type, the last field is duplicated until the minimum number of fields is reached by adding duplicates after the last field. Each field uses a customizable options menu.

To create a field, add the `item-comparison-form__field` class to an element in the form. The field's menu template is specified using the `data-template` attribute and static parameters can be specified with a JSON object string in the `data-static` attribute. A label and/or an element with the `item-comparison-form__field-input` class can be added inside the form field element. The field input element will act as a button to toggle the field menu and will also contain the display text for the option that was chosen. A default option can be added using the `data-value` attribute, and the default option's display text can be added inside the field input element.

In the menu template, elements that can be clicked as options should have the `item-comparison-option` class added to them. The value that will be passed into the content template is specified using the `data-value` attribute, and the display text that will be shown in the field input element is specified using the `data-text` attribute.

In the form, there should be a submit button that will load content into the content container. A submit button can be specified by adding the `item-comparison-submit` class to an element in the the form. The submit button's content template is specified using the `data-template` attribute and static parameters can be specified with a JSON object string in the `data-static` attribute.

A content container can be specified by giving an element an id that corresponds with the id of the form. For example, if the form has an id of `weapon-comparison` then the content container should have an id of `weapon-comparison-content-container`.

## Example

**Form:**
```
<div id="weapon-comparison" class="item-comparison-form" data-form-type="duplicate" data-min-fields="2">
  <div class="item-comparison-form__field" data-template="WeaponComparisonMenu">Weapon: <span class="item-comparison-form__field-input">
  </span></div>
  <div class="item-comparison-submit" data-template="WeaponComparison" data-static='{"exclude":"description"}'>Submit</div>
</div>
<div id="weapon-comparison-content-container"></div>
```

**Field menu:**
```wikitext
* <span class="item-comparison-option" data-value="Pulsar VS1" data-text="Pulsar VS1">Pulsar VS1</span>
* <span class="item-comparison-option" data-value="Equinox VE2" data-text="Equinox VE2">Equinox VE2</span>
* <span class="item-comparison-option" data-value="Equinox VE2 Burst" data-text="Equinox VE2 Burst">Equinox VE2 Burst</span>
* <span class="item-comparison-option" data-value="H-V45" data-text="H-V45">H-V45</span>
* <span class="item-comparison-option" data-value="CME" data-text="CME">CME</span>
* <span class="item-comparison-option" data-value="Terminus VX-9" data-text="Terminus VX-9">Terminus VX-9</span>
* <span class="item-comparison-option" data-value="Corvus VA55" data-text="Corvus VA55">Corvus VA55</span>
* <span class="item-comparison-option" data-value="VE-A Lacerta" data-text="VE-A Lacerta">VE-A Lacerta</span>
* <span class="item-comparison-option" data-value="Darkstar" data-text="Darkstar">Darkstar</span>
```

## Inspiration
Inspired by [Duel Masters Play Wiki's Advanced Card Search](https://duelmastersplays.fandom.com/wiki/Advanced_Card_Search).
