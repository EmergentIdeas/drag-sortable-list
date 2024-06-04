
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
	
	let emitter = list1.emitter
	emitter.on('list-change', (evt) => {
		let eventLog = document.querySelector('.event-log')
		evt.cells.forEach(cell => {
			eventLog.innerHTML = eventLog.innerHTML + evt.type + ': ' + cell.innerText + '\n'
		})
	})
	

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

let elList4 = document.querySelector('.list4')
if(elList4) {
	let list4 = new ListView({
		el: elList4
		, mobileHandleSelector: '.cell .handle'
		, desktopHandleSelector: '.handle' 
		, events: {
			'click a': 'linkClick'
		}
		, linkClick(evt, selected) {
			evt.preventDefault()
			console.log(selected.innerText)
		}
	})
	list4.render()
}

document.querySelectorAll('.file-cells .cell').forEach(cell => {
	cell.addEventListener('dragstart', (evt) => {
		let uriListText = cell.getAttribute('data-uri-list')
		evt.dataTransfer.setData('text', uriListText)
		evt.dataTransfer.setData('text/uri-list', uriListText)
		
		if(! cell.classList.contains('no-label')) {
			let label = `data:text/label,${cell.innerText}`
			evt.dataTransfer.setData(label, label)
		}
	})
})


