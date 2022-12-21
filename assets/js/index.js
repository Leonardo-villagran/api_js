//Definir variables globales.
const boton = document.querySelector("#boton");
const footer = document.querySelector("#footer");
const agregar = document.querySelector("#agregar");
const error = document.querySelector("#error");
let chart = document.querySelector("#chart");
const grafico_titulo=document.querySelector("#grafico_titulo");

let cod = ""
let myChart=null;

const selector = document.querySelector("#selector");
const apiURL = "https://mindicador.cl/api/";


async function getMindicador() {
    //Captura de datos desde la API url.
    try {
        const res = await fetch(apiURL);
        const Mindicador = await res.json();
        return Mindicador;
    } 

    //En caso de que la API url de un error.
    catch (e) {
        error.innerHTML = `<h1 class='text-danger'>Error desde la API</h1>
        <div class='bg-danger'>${e.message}</div>`;
    }
}

async function renderMindicador() {

    const Mindicador = await getMindicador();
    let template = "";

    //recorrer el objeto 
    for (let indicador of Object.keys(Mindicador)) {

        //obtener el nombre del código. 
        let codigo = Mindicador[indicador].codigo;

        //Obtener la unidad de médida del código.
        let unidad_medida = Mindicador[indicador].unidad_medida;
        
        //Obtener el valor del código.
        let valor = Mindicador[indicador].valor;

        //Determinar los códigos que se van a utilizar. Solo se usarán los que estén en pesos y el código no sea igual a ivp.

        if ((unidad_medida == 'Pesos') && codigo != 'ivp') {

            //En el contenido del dropdown utilizar los códigos en mayúscula y sin guión bajo para seleccionar indicador.  
            let codigoVisual = codigo.toUpperCase().replace('_', ' ');
            
            //Almacenar nombre de código para utilizar en la selección del tipo de indicador.
            let codigoParse = codigo;

            //Se agrega cada indicador con un objeto que tenga el nombre del indicador y su valor asociado. 

            template += `
                <option value='{"key1":"${codigoParse}","key2":"${valor}"}'>${codigoVisual}</option>
            `;
        }
    }
    //console.log(template);

    //Imprimir todas las opciones dentro del select con id llamado selector.
    selector.innerHTML = template;
}
//Comenzar con el proceso de captura de información desde API url.
renderMindicador()

//En caso de presionar el botón de buscar realizar la siguiente función. 
boton.addEventListener("click", () => {

    //Almacenar en variable el valor del input.
    let pesos = agregar.value;
    //Quitar espacios en blanco en el input.
    pesos = pesos.trim();

    //Si el contenido del input es vacío, realizar un alert. 
    if (pesos === "") {
        agregar.value = "";
        alert("No dejar espacios vacíos");
    }
    //En caso de que el contenido no sea vacío, procesar los datos. 
    else {
        
        //Obtener los valores asociados a la opción seleccionada. 
        const valores = document.querySelector("#selector").value;
        //Parsear los valores para obtener el nombre y su valor. 
        var myValue = JSON.parse(valores);
        
        //Almacenar el nombre del código.
        let nombre=myValue.key1;
        //Almacenar el valor del código.
        let valor=myValue.key2;

        //Realizar el calculo asociado al código y su valor.  
        const total = pesos / valor;

        let redondear = parseFloat(total).toFixed(3);
        let esNum = new Intl.NumberFormat('es-ES')
        redondear = esNum.format(redondear)

        footer.innerHTML = `<p>Resultado: ${redondear}</p>`

        const Apicod = `https://mindicador.cl/api/${nombre}`;
        renderGrafica(Apicod, nombre);


    }

});

async function getFechas(Apicod) {

    const endpoint = Apicod;
    const res = await fetch(endpoint);
    const Fechas = await res.json();
    const serie=Fechas.serie
    return serie;
}


function prepararConfiguracionParaLaGrafica(fechas, nombre) {

    // Creamos las variables necesarias para el objeto de configuración
    const tipoDeGrafica = "line";
    const nombresDeLasFechas = fechas.map((fechaArreglo) => {
        let fechaActual=fechaArreglo.fecha;
        let date = new Date(Date.parse(fechaActual));
        fecha=date.toLocaleDateString('es-ES');
        return fecha;
    });

    //console.log(nombresDeLasMonedas);
    const titulo =nombre.toUpperCase();
    const colorDeLinea = "red";
    const valores = fechas.map((fechaArreglo) => fechaArreglo.valor);

    let fechas_reversed=[];
    let valores_reversed=[];

    for (let i = 0; i <= 10 ; i++) {
        fechas_reversed[i]=nombresDeLasFechas[10-i];
    }

    for (let j = 0; j <= 10 ; j++) {
        valores_reversed[j]=valores[10-j];
    }

    // Creamos el objeto de configuración usando las variables anteriores
    const config = {
        type: tipoDeGrafica,
        data: {
            labels: fechas_reversed,
            datasets: [
                {
                    label: titulo,
                    backgroundColor: colorDeLinea,
                    borderColor: "red",
                    data: valores_reversed
                }
            ]
        }
    };
    return config;
}
async function renderGrafica(Apicod, nombre) {

    const titulo=nombre.replace('_', ' '); 
    grafico_titulo.innerHTML = ("Últimos 10 indicadores de "+titulo).toUpperCase();
    const fechas = await getFechas(Apicod);
    const config = prepararConfiguracionParaLaGrafica(fechas, nombre);
    const chartDOM = document.getElementById("myChart");
    chartDOM.style.backgroundColor = "white";
    
    if (myChart!=null){
        myChart.destroy();
    }
    myChart=new Chart(chartDOM, config);

}