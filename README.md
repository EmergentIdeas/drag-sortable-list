# Drag Sortable List

Creates a draggable list/queue of html elements. It can accept files and html elements dragged into
the list.

While it does have a lot of functionality and extensibility, it's pretty light weight at something like 9k (unzipped) as opposed to
something like sortable.js, which is great, but 300k. 


# Install

```bash
npm install @webhandle/drag-sortable-list
```
This can be used in the normal way, but there's also a compiled version at `public/js/index.js`

# Usage

## Markup

```html
<div class="list1 webhandle-drag-sortable-list">
	<div class="cell">
		<span class="handle">↕</span>
		a 
	</div>
	<div class="cell">
		<span class="handle">↕</span>
		b 
	</div>
	<div class="cell">
		<span class="handle">↕</span>
		c 
	</div>
	<div class="cell">
		<span class="handle">↕</span>
		d
		<br>
		e 
	</div>
</div>
```

## Script

The most basic, "just let the items get dragged up and down", script

```js
import ListView from '@webhandle/drag-sortable-list'

let elList1 = document.querySelector('.list1')
let list1 = new ListView({
	el: elList1
	, mobileHandleSelector: '.handle'
})
list1.render()
```

## Styling

No styling is required at all, but as an example of some really basic styling:

```less
.list1 {
	width: 500px;
	height: 500px;
	border: solid 1px black;
	
	
	.cell {
		border-top: solid transparent 2px;
		border-bottom: solid transparent 2px;
		min-height: 10px;
		background-color: #eeeeee;
		background-clip: padding-box;
		padding: 10px;
		
		&.dragging {
			background-color: #cccccc;
		}
		
		.handle {
			display: inline-block;
			text-align: center;
			width: 40px;
			background-color: #dddddd;
		}
	}
}
```

## Dragging HTML page objects

This list supports dragging other page objects onto the list. They'll have to be
`draggable="true` of course, for the page to respond to the drag.
Also, the drag event MUST have data starting with `data:text/label,` or the list (by default)
won't see it as something which can be added to the list.

```js

document.querySelectorAll('.draggable-thing').forEach(cell => {
	cell.addEventListener('dragstart', (evt) => {
		let uriListText = cell.getAttribute('data-uri-list')
		evt.dataTransfer.setData('text', uriListText)
		evt.dataTransfer.setData('text/uri-list', uriListText)
		
		let label = `data:text/label,${cell.innerText}`
		evt.dataTransfer.setData(label, label)
	})
})
```

```html
<div class="draggable-thing" draggable="true" data-uri-list="http://files/file1.txt,http://files/file2.txt">
	box 1
</div>
```

## Reordering

An event emitter is available which issues events for re-orders and drops

```js
let emitter = list1.emitter
emitter.on('list-change', (evt) => {
	let eventLog = document.querySelector('.event-log')
	evt.cells.forEach(cell => {
		let msg = evt.type + ': ' + cell.innerText
		// do something with msg, type is: reorder, drop
		
		// get all the cells to update the order or something
		let cells = list1.getCells()
	})
})
```



## Customization

### Responding to events within the cells

You can add event handlers in the normal Backbone fashion.


```js
import ListView from '@webhandle/drag-sortable-list'

let elList1 = document.querySelector('.list1')
let list1 = new ListView({
	el: elList1
	, mobileHandleSelector: '.cell .handle'
	, events: {
		'click a': 'linkClick'
	}
	, linkClick(evt, selected) {
		evt.preventDefault()
		console.log(selected.innerText)
	}
})
list1.render()
```

### Options

For creating new cells from dropped items.

```js

/**
 * Creates permanent cells for files dropped into the list
 * @param {array} files 
 * @returns an array of Elements
 */
createCellsForFiles(files) 


/**
 * Creates permanent cells for resource objects dropped into the list
 * @param {array[string]} uriList 
 * @returns an array of Elements 
 */
createCellsForUriList(uriList) 


/**
 * Creates permanent cells for drops of unknown types.
 * @param {Event} evt 
 * @returns An array of elements
 */
createCellsForUnknownType(evt) 

```