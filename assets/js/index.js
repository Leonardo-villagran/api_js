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
    try {

        const res = await fetch(apiURL);
        const Mindicador = await res.json();
        return Mindicador;

    } catch (e) {
        error.innerHTML = `<h1 class='text-danger mt-3'>Error desde la API</h1>
        <div class='bg-danger mb-3'>${e.message}</div>`;
    }
}

async function renderMindicador() {

    const Mindicador = await getMindicador();
    let template = "";

    for (let indicador of Object.keys(Mindicador)) {

        let codigo = Mindicador[indicador].codigo;

        let unidad_medida = Mindicador[indicador].unidad_medida;
        let valor = Mindicador[indicador].valor;

        if ((unidad_medida == 'Pesos') && codigo != 'ivp') {

            //let codigoParse = codigo.toUpperCase().replace('_', ' ');
            let codigoParse = codigo;


            template += `
                <option value="${valor}">${codigoParse}</option>
            `;
        }
    }

    selector.innerHTML = template;
}
renderMindicador()

boton.addEventListener("click", () => {

    let pesos = agregar.value;
    //Quitar espacios en blanco en el input.
    pesos = pesos.trim();

    //Ingresar un nuevo objeto si el contenido no es vacío.

    if (pesos === "") {
        agregar.value = "";
        alert("No dejar espacios vacíos");
    }
    else {
        const valor = document.querySelector("#selector").value;
        const sel = document.querySelector("#selector")
        var nombre = sel.options[sel.selectedIndex].text;

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