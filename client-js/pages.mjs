import {default as go} from './index.js'
go()


// import process from "process";
// process.version

import ListView from '../client-lib/list-view.mjs'

let elList1 = document.querySelector('.list1')
if(elList1) {
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
}


let elList2 = document.querySelector('.list2')
if(elList2) {
	let list2 = new ListView({
		el: elList2
		, mobileHandleSelector: '.cell .handle'
		, events: {
			'click a': 'linkClick'
		}
		, linkClick(evt, selected) {
			evt.preventDefault()
			console.log(selected.innerText)
		}
	})
	list2.render()
}

document.querySelectorAll('.file-cells .cell').forEach(cell => {
	cell.addEventListener('dragstart', (evt) => {
		// let uriListText = cell.getAttribute('data-uri-list').split(',').join('\r\n') + '\r\n'
		let uriListText = cell.getAttribute('data-uri-list')
		evt.dataTransfer.setData('text', uriListText)
		evt.dataTransfer.setData('text/uri-list', uriListText)
		
		if(! cell.classList.contains('no-label')) {
			let label = `data:text/label,${cell.innerText}`
			evt.dataTransfer.setData(label, label)
		}
	})
})
