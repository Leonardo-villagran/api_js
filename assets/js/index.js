//Definir variables globales.
const boton = document.querySelector("#boton");
const footer = document.querySelector("#footer");
const agregar = document.querySelector("#agregar");
const error = document.querySelector("#error");
let chart = document.querySelector("#chart");

const grafico_titulo=document.querySelector("#grafico_titulo");

//let cod = ""
//Se genera un gráfico nulo al iniciar.
let myChart=null;

//Se define donde se colocarán las opciones de selección 
const selector = document.querySelector("#selector");
//Se almacena la dirección de la API a utilizar. 
const apiURL = "https://mindicador.cl/api/";

//Función que se comunica con la API url
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

//Se determinan los datos que se utilizarán de la API url. 
async function renderMindicador() {

    const Mindicador = await getMindicador();
    let template = "";


    //recorrer el objeto 
    for (let indicador of Object.keys(Mindicador)) {

        //obtener el nombre del código. 
        let codigo = Mindicador[indicador].codigo;

        //console.log(indicador.codigo);

        //Obtener la unidad de médida del código.
        let unidad_medida = Mindicador[indicador].unidad_medida;
        
        //Obtener el valor del código.
        let valor = Mindicador[indicador].valor;

        //Determinar los códigos que se van a utilizar. Solo se usarán los que estén en pesos y el código no sea igual a ivp.

        if ((unidad_medida == 'Pesos') && codigo != 'ivp') {

            //En el contenido del dropdown utilizar los nombres en mayúscula para seleccionar indicador. 
            let nombre = Mindicador[indicador].nombre;
            let codigoVisual = nombre.toUpperCase();
            
            //Almacenar nombre de código para utilizar en la selección del tipo de indicador.
            let codigoParse = codigo;

            //Se define value en formato Json para pasar más de un valor desde el select. 
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

        //Realizar el cálculo asociado al código y su valor.  
        const total = pesos / valor;

        //Redondear el resultado a tres cifras decimales.
        let redondear = parseFloat(total).toFixed(4);

        //Mostrar el resultado en formato español.
        let esNum = new Intl.NumberFormat('es-CL')
        redondear = esNum.format(redondear)

        //Imprimir resultado en el card.
        footer.innerHTML = `<p>Resultado: $${redondear}</p>`

        //Llamar a la API asociada a cada indicador y realizar el gráfico. 
        const Apicod = `https://mindicador.cl/api/${nombre}`;
        renderGrafica(Apicod, nombre);


    }

});


//Obtener las fechas que se encuentran dentro de la API cada el indicador seleccionado.
async function getFechas(Apicod) {

    const endpoint = Apicod;
    const res = await fetch(endpoint);
    const Fechas = await res.json();
    const serie=Fechas.serie
    return serie;
}

    // Creamos las variables necesarias para el objeto de configuración
function prepararConfiguracionParaLaGrafica(fechas, nombre) {

    //Se realizará gráfico en formato de línea
    const tipoDeGrafica = "line";

    //Se configuran el arreglo de fechas, para que tengan formato español.
    let nombresDeLasFechas = fechas.map((fechaArreglo) => {
        let fechaActual=fechaArreglo.fecha;
        let date = new Date(Date.parse(fechaActual));
        fecha=date.toLocaleDateString('es-ES');
        return fecha;
    });

    //Se coloca el título en mayúsculas
    const titulo =nombre.toUpperCase();
    //Se configura la línea de color rojo.
    const colorDeLinea = "red";
    //Se almacenan los valores de cada fecha en la constante valores.
    let valores = fechas.map((fechaArreglo) => fechaArreglo.valor);

    let fechas_reversed=[];
    let valores_reversed=[];
    
    //Se almacenan las últimas 10 fechas del indicador seleccionado
    fechas_reversed=nombresDeLasFechas.slice(0,10);
    console.log(fechas_reversed);

    //Se almacenan los últimos  10 valores asociados a las fechas del indicador seleccionado.
    valores_reversed=valores.slice(0,10);
    console.log(valores_reversed);

    //Se reversan los arreglos para que los resultados queden de izquierda a derecha en el gráfico. 
    const f=fechas_reversed.reverse();
    const v=valores_reversed.reverse();
    
    // Creamos el objeto de configuración usando las variables anteriores
    const config = {
        type: tipoDeGrafica,
        data: {
            labels: f,
            datasets: [
                {
                    label: titulo,
                    backgroundColor: colorDeLinea,
                    borderColor: "red",
                    data: v
                }
            ]
        }
    };
    return config;
}

//Generar gráfico.
async function renderGrafica(Apicod, nombre) {

    //Si el indicador tiene un guión bajo se reemplaza por unn espacio en blanco. 
    const titulo=nombre.replace('_', ' '); 
    grafico_titulo.innerHTML = ("Últimos 10 indicadores de "+titulo).toUpperCase();
    //Se llama a la API y se obtienen las fechas en formato español. 
    const fechas = await getFechas(Apicod);
    //Se procesan los datos de para generar la gráfica.
    const config = prepararConfiguracionParaLaGrafica(fechas, nombre);

    //se ingresa la etiqueta canvas donde se imprimirá el gráfico.
    chart.innerHTML='<canvas id="myChart" class="myChart"></canvas>'
    
    //Se selecciona la etiqueta donde se imprimirá el gráfico.
    const chartDOM = document.getElementById("myChart");

    //Se le asigna el color blanco al fondo del gráfico.
    chartDOM.style.backgroundColor = "white";
    
    //Se destruye el gráfico si se vuelve a crear. Cada vez que se realiza una búsqueda y el gráfico está creado se genera un error, por esa razón se destruye si el gráfico existe. 
    
    if (myChart!=null){
        myChart.destroy();
    }
    //Se genera el gráfico con su configuración asociada. 
    myChart=new Chart(chartDOM, config);

}