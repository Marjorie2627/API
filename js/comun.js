function iniciar_estado() {
    vista_actual = '';
    g_rol = null;
    g_url_fotos = 'https://minsal-fotos.s3.amazonaws.com/';
    roles_activos = [];
};

iniciar_estado();

const roles = {}


// -------------------------------------------------------------------------------
// Funciones globales

function minsal_ui_cargar_vista(nombre_vista, preservar = true) {
    if (preservar) {
        vista_actual = nombre_vista;
    }

    $('#contenedorprincipal').load(nombre_vista + '.html', () => {
        if (preservar) {
            window.document.title = 'Tramites MINSAL - ' + nombre_vista;
            window.location.hash = '#' + vista_actual;
        }
    });
}

function minsal_set_cookie_key(cookie, key, value) {
    var obj = JSON.parse(getCookie(cookie));
    obj[key] = value;
    setCookie(cookie, JSON.stringify(obj));
}

function minsal_get_cookie_key(cookie, key, value) {
    var obj = JSON.parse(getCookie(cookie));
    return obj[key] && obj[key] || value;
}

function minsal_cambio_rol(id_rol) {
    minsal_set_cookie_key('edata', 'rol', id_rol);
}

function usuario_get_id() {
    return minsal_get_cookie_key('edata', 'id_usuario', null);
}

// ---------------------------------------------------------- Confirm 

function minsal_modal(titulo, mensaje) {
    $('<div class="modal" tabindex="-1" role="dialog" style="display: none;"> \
        <div class="modal-dialog" role="document"> \
            <div class="modal-content"> \
                <div class="modal-header"> \
                    <h5 class="modal-title">' + titulo + '</h5> \
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close"> \
                        <span aria-hidden="true">&times;</span> \
                    </button> \
                </div> \
                <div class="modal-body"> \
                    <p>' + mensaje + '</p> \
                </div> \
                <div class="modal-footer"> \
                    <button type="button" class="btn btn-primary" data-dismiss="modal">Entendido</button> \
                </div> \
            </div> \
        </div> \
    </div>').modal();
}


 
  // ---------------------------------------------------------- Confirm  

// ---------------------------------------------------------- Generic Confirm  

function minsal_confirm(heading, question, cancelButtonTxt, okButtonTxt, callback) {

    var confirmModal =
        $('<div class="modal fade">' +
            '<div class="modal-dialog">' +
            '<div class="modal-content">' +
            '<div class="modal-header">' +
            '<h3>' + heading + '</h3>' +
            '<a class="close" data-dismiss="modal" >&times;</a>' +
            '</div>' +

            '<div class="modal-body">' +
            '<p>' + question + '</p>' +
            '</div>' +

            '<div class="modal-footer">' +
            '<a  class="btn" data-dismiss="modal">' +
            cancelButtonTxt +
            '</a>' +
            '<a  id="okButton" class="btn btn-primary">' +
            okButtonTxt +
            '</a>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>');

    confirmModal.find('#okButton').click(function(event) {
        callback();
        confirmModal.modal('hide');
    });

    confirmModal.modal('show');
};


// -------------------------------------------------------------------------------
// Metodos REST

function minsal_put(endpoint, callback_success, callback_error, data_raw = null) {
   
    minsal_request(endpoint, 'PUT', callback_success, callback_error, data_raw)
}

function minsal_post(endpoint, callback_success, callback_error, data_raw = null) {
   
    minsal_request(endpoint, 'POST', callback_success, callback_error, data_raw)
}

function minsal_delete(endpoint, callback_success, callback_error, data_raw = null) {
    
    minsal_request(endpoint, 'DELETE', callback_success, callback_error, data_raw)
}

function minsal_get(endpoint, callback_success, callback_error, data_raw = null) {
   
    minsal_request(endpoint, 'GET', callback_success, callback_error, data_raw)
}

function minsal_get_cached(endpoint, callback_success, callback_error, data_raw = null) {
    
    minsal_request(endpoint, 'GET', callback_success, callback_error, data_raw, true)
}

function minsal_request(endpoint, method, callback_success, callback_error, data_raw, cached) {
    refrescar();
    cached = (typeof cached !== 'undefined') ? cached : false;
    let options = {
        url: api_url + endpoint,
        method: method,
        cache: cached,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': "bearer " + getCookie('token') || ''
        },
        success: function(msg) {
            callback_success(msg);
        },
        error: function(jqXHR, status, err) {
            callback_error(jqXHR, status, err);
        },
    }

    if (data_raw) {
        options['data'] = JSON.stringify(data_raw);
    }

    $.ajax(options);
}

// ----------------------------------------------------------------

function localDate(iso8601) {
    var dateParts = iso8601.split("-");
    var jsDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2].substr(0, 2));
    return jsDate.toLocaleDateString('es-SV');
}

function removerSegundos(hora24) {
    return hora24.replace(/(\d\d:\d\d):\d\d/, '$1');
}

/*
 *  appendEmptyOption:
 *      Funcion que permite agregar un option vacio, normalmente utilizado en la
 *      inicializaicón del select2
 *
 *  Parámetros:
 *      id: id del elemento al cual se le quiere agregar un option vacio.
 */
function appendEmptyOption(id) {
    if($('#'+id).find('option[value=""]').length === 0 && $('#'+id).find('option[value=null]').length === 0 && $('#'+id).find('option:not([value])').length === 0 && ( typeof $('#'+id).attr('multiple') === 'undefined' || $('#'+id).attr('multiple') === false ) ) {
        $('#'+id).prepend('<option/>').val(function(){
            return $('[selected]',this).val();
        });
    }
 }
 
function initializeSelect2(element, blankOption, removeChildren, options) {
    if (removeChildren) {
        element.children().remove();
    }

    if (blankOption) {
        appendEmptyOption(jQuery(element).attr('id'));
    }

    if (typeof options === 'undefined' || options == '' || options === null) {
        options = {
            placeholder: 'Seleccione...',
            allowClear: true,
            containerCss: {
                'width': '100%'
            },
            theme: 'bootstrap',
        }
    }

    element.select2(options);
}


function getEstablecimientos (){
    let datos ;
    url = api_url + 'admin/establecimiento/findby_active';
    let establecimientos =  $.ajax({
        async: false,
        method: "GET",
        crossDomain: true,
        dataType:'json',
        mode: 'cors',
        headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': getCookie('token')
            },
        url: url,
        success: function (data) {
            return datos  = data;
        }
    });

    return establecimientos.responseJSON;
}

function refrescar() {

    let te = getCookie("token_expire")
	try {						
        if (new Date() > new Date(te)) {
            $.ajax({
                async:false,
                url: api_url + 'api/refrescar',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': "bearer" + getCookie('token')
                },
                success: function (msg) {
                    setCookie("token", msg.access_token, 1);
                    var f = new Date();
                    f.setSeconds(f.getSeconds() + msg.expires_in)
                    setCookie("token_expire", f.toString(), 1)
                    
                },
                error: function(jqXHR, status, err) {
                    callback_error(jqXHR, status, err);
                    destCookie();
			        document.location.href = "login.html";
                },
            });
        }
    } catch (e) { throw "token invalido"; }
}
