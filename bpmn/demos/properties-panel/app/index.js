import $ from 'jquery';
import BpmnModeler from 'bpmn-js/lib/Modeler';

import propertiesPanelModule from 'bpmn-js-properties-panel';
import propertiesProviderModule from 'bpmn-js-properties-panel/lib/provider/camunda';
import camundaModdleDescriptor from 'camunda-bpmn-moddle/resources/camunda.json';
import SelfDescriptor from "./SelfDescriptor.json";

import {
  debounce
} from 'min-dash';

import diagramXML from '../resources/myDiagram.bpmn';
// import diagramXML from '../resources/newDiagram.bpmn';


var container = $('#js-drop-zone');

var canvas = $('#js-canvas');

var bpmnModeler = new BpmnModeler({
  container: canvas,
  propertiesPanel: {
    parent: '#js-properties-panel'
  },
  additionalModules: [
    propertiesPanelModule,
    propertiesProviderModule
  ],
  moddleExtensions: {
    camunda: camundaModdleDescriptor,
    self: SelfDescriptor
  }
});
container.removeClass('with-diagram');

function createNewDiagram() {
  openDiagram(diagramXML);
}

async function openDiagram(xml) {

  try {

    await bpmnModeler.importXML(xml);

    container
      .removeClass('with-error')
      .addClass('with-diagram');
  } catch (err) {

    container
      .removeClass('with-diagram')
      .addClass('with-error');

    container.find('.error pre').text(err.message);

    console.error(err);
  }
}

function registerFileDrop(container, callback) {

  function handleFileSelect(e) {
    e.stopPropagation();
    e.preventDefault();

    var files = e.dataTransfer.files;

    var file = files[0];

    var reader = new FileReader();

    reader.onload = function(e) {

      var xml = e.target.result;

      callback(xml);
    };

    reader.readAsText(file);
  }

  function handleDragOver(e) {
    e.stopPropagation();
    e.preventDefault();

    e.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
  }

  container.get(0).addEventListener('dragover', handleDragOver, false);
  container.get(0).addEventListener('drop', handleFileSelect, false);
}


////// file drag / drop ///////////////////////

// check file api availability
if (!window.FileList || !window.FileReader) {
  window.alert(
    'Looks like you use an older browser that does not support drag and drop. ' +
    'Try using Chrome, Firefox or the Internet Explorer > 10.');
} else {
  registerFileDrop(container, openDiagram);
}

// bootstrap diagram functions

$(function() {

  $('#js-create-diagram').click(function(e) {
    e.stopPropagation();
    e.preventDefault();

    createNewDiagram();
  });

  var downloadLink = $('#js-download-diagram');
  var downloadSvgLink = $('#js-download-svg');

  $('.buttons a').click(function(e) {
    if (!$(this).is('.active')) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  function setEncoded(link, name, data) {
    var encodedData = encodeURIComponent(data);

    if (data) {
      link.addClass('active').attr({
        'href': 'data:application/bpmn20-xml;charset=UTF-8,' + encodedData,
        'download': name
      });
    } else {
      link.removeClass('active');
    }
  }

  var exportArtifacts = debounce(async function() {

    try {

      const { svg } = await bpmnModeler.saveSVG();

      setEncoded(downloadSvgLink, 'diagram.svg', svg);
    } catch (err) {

      console.error('Error happened saving SVG: ', err);

      setEncoded(downloadSvgLink, 'diagram.svg', null);
    }

    try {

      const { xml } = await bpmnModeler.saveXML({ format: true });

      setEncoded(downloadLink, 'diagram.bpmn', xml);
    } catch (err) {

      console.log('Error happened saving XML: ', err);

      setEncoded(downloadLink, 'diagram.bpmn', null);
    }
  }, 500);


  bpmnModeler.on('commandStack.changed', function () {
    bpmnModeler.saveXML({ format: true}).then(function (data) {
      console.log(data.xml)
    })
  });

  bpmnModeler.on("element.click", function (event, eventObj) {
    console.log(event.type);
    console.log(eventObj.element);
    const moddle = bpmnModeler.get("moddle");

    // 自定义属性1
    const attrOne = moddle.create("se:AttrOne", { name: "testAttrOne", values: [] });
    // 自定义属性子属性
    const attrOneProp = moddle.create("se:AttrOneProp", {propName: "propName1", value: "propValue1"})
    // 自定义属性2
    const attrTwo = moddle.create("se:AttrTwo", { value: "testAttrTwo" })
    // 原生属性Properties
    const props = moddle.create("camunda:Properties", { values: [] });
    // 原生属性Properties的子属性
    const propItem = moddle.create("camunda:Property", { name: "原生子属性name", values: "原生子属性value" });
    // 原生扩展属性数组
    const extensions = moddle.create("bpmn:ExtensionElements", { values: [] })

    // 开始节点插入原生属性
    // if (eventObj.element.type === "bpmn:StartEvent") {
    //   props.values.push(propItem);
    //   extensions.values.push(props);
    // }
    // // 任务节点插入多种属性
    // if (eventObj.element.type === "bpmn:Task") {
    //   props.values.push(propItem, propItem);
    //
    //   attrOne.values.push(attrOneProp);
    //
    //   extensions.values.push(props, attrOne, attrTwo);
    // }
    // // root插入自定义属性
    // if (eventObj.element.type === "bpmn:Process") {
    //   attrOne.values.push(attrOneProp, attrOneProp);
    //
    //   extensions.values.push(attrOne);
    // }

    // bpmnModeler.get("modeling").updateProperties(eventObj.element, {
    //   extensionElements: extensions
    // });
  })
});
