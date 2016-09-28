/*global $, ace, console*/
$('document').ready(function () {
  var formObject = {
    schema: {
      example: {
        title: 'JSON Form example to start from',
        type: 'string',
        'enum': [
          'wiwo-repayment-widget-simplest'
          ,'wiwo-repayment-widget-simple'
          ,'wiwo-repayment-widget-full'
        ],
        'default': 'wiwo-repayment-widget-simplest'
      },
      greatform: {
        title: 'JSON Form object to render',
        type: 'string'
      }
    },
    form: [
      {
        key: 'example',
        notitle: true,
        prepend: 'Try with',
        htmlClass: 'trywith',
        titleMap: {
          'wiwo-repayment-widget-simplest': 'Repayment simplest'
        },
        onChange: function (evt) {
          var selected = $(evt.target).val();

          loadExample(selected);
          if (history) {
            history.pushState(
              { example: selected},
              'Example - ' + selected,
              '?example=' + selected
            );
          }
        }
      },
      {
        key: 'greatform',
        type: 'ace',
        aceMode: 'json',
        width: '100%',
        height: '' + (window.innerHeight - 140) + 'px',
        notitle: true,
        onChange: function () {
          generateForm();
        }
      }
    ]
  };


  /**
   * Extracts a potential form to load from query string
   */
  var getRequestedExample = function () {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    var param = null;
    for (var i = 0; i < vars.length; i++) {
      param = vars[i].split('=');
      if (param[0] === 'example') {
        return param[1];
      }
    }
    return null;
  };

  /**
   * Loads and displays the example identified by the given name
   */
  var loadExample = function (example) {
    $.when(
      $.ajax({
        url: 'schemas/' + example + '.json',
        dataType: 'text'
      }),
        
      _loadData(example)
    ).then(
      function(schemaArgs, dataArgs){
        updateWithSchemaAndData(schemaArgs[0], dataArgs[0]);
      },
      function(){
        $('#result').html('Sorry, I could not retrieve the example!');
      }
    );
  };
  
  
  /**
   * Workaround for old jquery promise support so we can recover
   * from a rejected promise state.
   * 
   * @private
   */
  function _loadData(example){
    var deferred = $.Deferred();
    
    $.ajax({
      url: 'data/' + example + '.json',
      dataType: 'text'
    }).then(function(data, status, xhr){
        deferred.resolve([data]);
      }, function(xjr, status, error){
        // return an empty data object.
        deferred.resolve(['{}']);
      });
    
    return deferred.promise();
  }
  
  
  var _data;
  var _formTree;
  function updateWithSchemaAndData(schema, data){
    _data = data;
    if (typeof data === 'string'){
      _data = JSON.parse(data);
    }
    
    var aceId = $('#form .ace_editor').attr('id');
    var editor = ace.edit(aceId);
    editor.getSession().setValue(schema);
  }


  /**
   * Displays the form entered by the user
   * (this function runs whenever once per second whenever the user
   * changes the contents of the ACE input field)
   */
  var generateForm = function () {
    var values = $('#form').jsonFormValue();

    // Reset result pane
    $('#result').html('');

    // Parse entered content as JavaScript
    // (mostly JSON but functions are possible)
    var createdForm = null;
    try {
      // Most examples should be written in pure JSON,
      // but playground is helpful to check behaviors too!
      eval('createdForm=' + values.greatform);
    }
    catch (e) {
      $('#result').html('<pre>Entered content is not yet a valid' +
        ' JSON Form object.\n\nJavaScript parser returned:\n' +
        e + '</pre>');
      return;
    }

    // Render the resulting form, binding to onSubmitValid
      createdForm.value = _data;
      
      createdForm.onSubmitValid = function (values) {
        if (console && console.log) {
          console.log('Values extracted from submitted form', values);
        }
        window.alert('Form submitted. Values object:\n' +
          JSON.stringify(values, null, 2));
      };
      createdForm.onSubmit = function (errors, values) {
        if (errors) {
          console.log('Validation errors', errors);
          return false;
        }
        return true;
      };
      
      // TESTING.
      // Create array field types - clone the defaults and set their `fieldtemplate` property to false.
      var arrayFieldTemplates = [
        'text',
        'password',
        'date',
        'datetime',
        'datetime-local',
        'email',
        'month',
        'number',
        'search',
        'tel',
        'time',
        'url',
        'week'
      ];
      _.each(arrayFieldTemplates, function(id){
        var o = _.clone(JSONForm.fieldTypes[id])
        o.fieldtemplate = false;
        JSONForm.fieldTypes['table'+id] = o;
      });
      
      function getParentType(node){
        var type = null;
        if (node && node.parentNode && node.parentNode.schemaElement){
          type = node.parentNode.schemaElement.type
        }
        return type;
      }
      
      createdForm.onBeforeRender = function(data, node){
        if (!node.schemaElement){
          return;
        }
        
        if (node.schemaElement.type == 'array' && node.schemaElement.items && node.schemaElement.items.type == 'object'){
          // console.log('onBeforeRender "array":\ndata=', data, ',\nnode=', node);
          node.view = JSONForm.fieldTypes['tablearray'];
          console.log('!!!tablearray\ndata=', data, '\nnode=', node);
          
        } else if (node.schemaElement.type == 'object' && getParentType(node) == 'array'){
          // Object item in an array.
          node.view = JSONForm.fieldTypes['tableobject'];
          console.log('@@@tableobject\ndata=', data, '\nnode=', node);
          
        } else if (getParentType(node.parentNode) == 'array' && getParentType(node) == 'object') {
          // Sub-property of the object item in an array.
          // The parent is an object on an array.
          
          // Get the view type.
          var type = node.formElement.type;
          var newView = JSONForm.fieldTypes['table'+type];
          if (newView){
            node.view = newView;
            
            // TODO: Wrap each child in a <td></td>.
            
            // We should be a leaf node - a text input or something like that.
            // Can we be a fieldset??
            console.log('###node.schemaElement.type=', type, ', newView=', newView);
          }
        }
      };
      // TESTING.
      
      $('#result').html('<form id="result-form" class="form-vertical" novalidate="novalidate"></form>');
      _formTree = $('#result-form').jsonForm(createdForm);
  };

  // Render the form
  _formTree = $('#form').jsonForm(formObject);
  
  
  // Delegate click listener
  $(document).on('click', '.js-btn-roundtrip', function(){
    // Check form data aginst original loaded content.
    var result = _formTree.validate();
    if (result.errors && result.errors.length){
      // has errors.
      console.warn('Errors: ', result.errors);
    } else {
      var data = _formTree.root.getFormValues();
      
      console.log('original _data=', _data);
      console.log('new data=', data);
    }
  });
  

  // Wait until ACE is loaded
  var itv = window.setInterval(function() {
    var example = getRequestedExample() || formObject.schema.example.default;
    $('.trywith select').val(example);
    if (window.ace) {
      window.clearInterval(itv);
      loadExample(example);
    }
  }, 1000);
});