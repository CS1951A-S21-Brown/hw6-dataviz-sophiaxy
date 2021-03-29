// Add your JavaScript code here
const MAX_WIDTH = Math.max(1080, window.innerWidth);
const MAX_HEIGHT = 800
const margin = {top: 40, right: 100, bottom: 40, left: 230};

// Assumes the same graph width, height dimensions as the example dashboard. Feel free to change these if you'd like
let graph_1_width = (MAX_WIDTH / 2) - 10, graph_1_height = 350;
let graph_2_width = (MAX_WIDTH / 2) + 80, graph_2_height = 350;
let graph_3_width = MAX_WIDTH / 2, graph_3_height = 700;

//load file
let filename = "data/netflix.csv";

// Set up SVG object with width, height and margin
let svg_1 = d3.select("#graph1")
    .append("svg")
    .attr("width", graph_1_width)     
    .attr("height", graph_1_height)    
    .append("g")
    .attr("transform",`translate(${margin.left}, ${margin.top})`);    


// create a linear scale for the x axis (number of occurrences)
let x1 = d3.scaleLinear()
.range([0, (graph_1_width-100-200)]);

// Create a scale band for the y axis (artist)
let y1 = d3.scaleBand().range([`${margin.top -30}`,(graph_1_height-`${margin.top}`-`${margin.bottom}`)]).padding(0.1);  


// Set up reference to count SVG group
let countRef1 = svg_1.append("g");
// Set up reference to y axis label to update text in setData
let y_axis_label_1 = svg_1.append("g");

//Add x-axis label
svg_1.append("text")
    .attr("transform",`translate(${(graph_1_width - margin.left - margin.right) / 2},
    ${(graph_1_height - margin.top - margin.bottom) })`)      
    .style("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Count");
    
// Add y-axis label
let y_axis_text_1 = svg_1.append("text")
    .attr("transform", `translate(-170, ${(graph_1_height - margin.top - margin.bottom ) / 2})`)      
    .style("text-anchor", "middle")
    .style("font-size", "12px");

// Add chart title
let title_1 = svg_1.append("text")
    .attr("transform", `translate(${(graph_1_width - margin.left - margin.right) / 2}, ${-20})`)      
    .style("text-anchor", "middle")
    .style("font-size", 15);

//garph 1 data: set for barplot
    //0: TV shows; 1: movies; 2: all
function setData_1(attr) {
    //Load the netflix CSV file into D3 by using the d3.csv() method. 
    d3.csv(filename).then(function(data) {
        var data_part = data.filter(function(d){
            if(attr != "all"){
                return d.type === attr;
            }
            else return d
            
        });
        
        var genres = getGenreCnt(data_part)[0];
        var genre_cnts = getGenreCnt(data_part)[1];
        var data_list = []
        for (var i=0;i<genres.length;i++){
            var dict = {};
            dict["genre"] = genres[i];
            dict["count"] = genre_cnts[i];
            data_list.push(dict);
        }
        data_list = rankData(data_list, function(a,b){
            return (parseInt(b["count"]) - parseInt(a["count"]));
        });
        
         // Update the x axis domain with the max count of the provided data (到竖线的距离)
         x1.domain([0,d3.max(data_list, function(d) {return d["count"]})]);

         // Update the y axis domains with the desired attribute
         y1.domain(data_list.map(function(d) { return d["genre"] }));
        // HINT: Use the attr parameter to get the desired attribute for each data point

        // Render y-axis label  (location of movie title)
        y_axis_label_1.call(d3.axisLeft(y1).tickSize(0).tickPadding(10));

        /*
            This next line does the following:
                1. Select all desired elements in the DOM
                2. Count and parse the data values
                3. Create new, data-bound elements for each data value
         */
        let bars = svg_1.selectAll("rect").data(data_list);
        let color = d3.scaleOrdinal()
        .domain(data_list.map(function(d) { return d["genre"] }))
        .range(d3.quantize(d3.interpolateHcl("#66a0e2", "#81c2c3"), data_list.length));

        
        // Render the bar elements on the DOM
        /*
            This next section of code does the following:
                1. Take each selection and append a desired element in the DOM
                2. Merge bars with previously rendered elements
                3. For each data point, apply styling attributes to each element

            Remember to use the attr parameter to get the desired attribute for each data point
            when rendering.
         */
        bars.enter()
            .append("rect")
            .merge(bars)
            .transition()
            .duration(1000)
            .attr("fill", function(d) {
                 return color(d["count"]) })
            .attr("x", x1(0))
            .attr("y", function(d) {
                return y1(d["genre"])})               
            .attr("width", function(d) {return x1(d["count"])})
            .attr("height",  y1.bandwidth());       

        /*
           x-axis labels next to its bar on the bar plot
         */
        let counts = countRef1.selectAll("text").data(data_list);

        //text elements on the DOM
        counts.enter()
            .append("text")
            .merge(counts)
            .transition()
            .duration(1000)
            .attr("x", function(d) {return 10 + x1(d["count"])})       
        .attr("y", function(d) {return  10 + y1(d["genre"])})      
        .style("text-anchor", "start")
        .style("font-size", "11px")
        .text(function (d) {
            return d["count"];
        });                 // Get the count of the genre

        y_axis_text_1.text(attr.charAt(0).toUpperCase()+ attr.slice(1)+ " Genres");
        title_1.text("1️⃣ Number of Title per Genre on Netflix (" + attr.charAt(0).toUpperCase() + attr.slice(1)+ ")");

        // Remove elements not in use if fewer groups in new dataset
        bars.exit().remove();
        counts.exit().remove();
    });

    function getGenreCnt(data) {
        var dict = {};
        data.filter(function(d){
            var genre_str = d.listed_in
            var genre_list = genre_str.split(',');
            for (var i = 0; i < genre_list.length; i++) {
                var genre = genre_list[i].trim();
                if(genre in dict){
                    dict[genre] += 1;
                }
                else{
                    dict[genre] = 1;
                }
            }
        });
        
        var genres = [];
        var cnts = [];
        for(const [key, value] of Object.entries(dict)){
            genres.push(key);
            cnts.push(value);
        }
        return [genres, cnts];
    }
}
function rankData(data, comparator) {
    data.sort(comparator);
    return data;
}
setData_1("Movie");

/////////////////////////////////////////////////////


/*Graph 2: scatter plot */





//////////////////////////////////////////////////////



    //set up SVG object with width, height and margin
    let svg = d3.select("#graph2")     
        .append("svg")
        .attr("width", graph_2_width)     
        .attr("height", graph_2_height+50)     
        .append("g")
        .attr("transform", `translate(${margin.left -50}, ${margin.top + 30})`);    // HINT: transform

    // Set up reference to tooltip
    let tooltip = d3.select("#graph2")    
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    /*
        tooltip settings
     */

    // Load the CSV file into D3 
    d3.csv(filename).then(function(data) {
        var data_part = data.filter(function(d){
            return d.type === "Movie";
            
        });
        // filter data and calculate average durations for years
        var year_cnt = {};
        var year_avg = {};
        for (var i=0;i<data_part.length;i++){
            var year = parseInt(data_part[i]["release_year"]);
            var durStr = data_part[i]["duration"].slice(0,-4);
            var dur = parseInt(durStr);
            if(year in year_cnt){
                var new_cnt = year_cnt[year] +1;
                var new_avg = (year_cnt[year]* year_avg[year] + dur)/new_cnt;
                year_cnt[year] += 1;
                year_avg[year] = new_avg;
            }
            else{
                year_cnt[year] = 1;
                year_avg[year] = dur;
            }
        }
        var data_list_2 = [];
        for(const [key, value] of Object.entries(year_avg)){
            var dict = {};
            dict["year"] = key;
            dict["avg"] = Math.round(value * 100) / 100;
            data_list_2.push(dict);
        }
    
        
        // Get a list containing the min and max years in the filtered dataset
        let extent = d3.extent(data_list_2, function(d) { return d.year; });
        //console.log(extent)
        /*
            d3.extent: return the min and max of a dataset.
         */

        // Create a time scale for the x axis
        let x = d3.scaleLinear()
            .domain(extent)
            .range([0, graph_2_width - margin.left - margin.right]);
        
        // Add x-axis label
        svg.append("g")
            .attr("transform", `translate(0, ${graph_2_height - margin.top - margin.bottom})`)     
            .call(d3.axisBottom(x).tickFormat(d3.format("d")));


        // Create a linear scale for the y axis
        let y = d3.scaleLinear()
            .domain([0, d3.max(data_list_2, function(d) { return d.avg; })])
            .range([graph_2_height - margin.top - margin.bottom,0]);
       
        //Add y-axis label
        svg.append("g")
            .call(d3.axisLeft(y));

        // Create a list of the groups in the nested data 
        let groups = data_list_2.map(function(d) { return d.avg });
        
        // add color
        let color = d3.scaleOrdinal()
            .domain(groups)
            .range(d3.quantize(d3.interpolateHcl("#66a0e2", "#ff5c7a"), groups.length));

        // Mouseover function to display the tooltip on hover
        let mouseover = function(d) {
            let color_span = `<span style="color: ${color(d.avg)};">`;
            let html = `Year: ${color_span}${d.year}
            </span><br/>
                    Average Duration: ${color_span}${d.avg}</span>`;       
            // Show the tooltip and set the position relative to the event X and Y location
            tooltip.html(html)
                .style("left", `${(d3.event.pageX) + 20}px`)
                .style("top", `${(d3.event.pageY) - 130}px`)
                .style("box-shadow", `2px 2px 5px ${color(d.avg)}`)    
                .transition()
                .duration(200)
                .style("opacity", 2)
        };

        // Mouseout function to hide the tool on exit
        let mouseout = function(d) {
            // Set opacity back to 0 to hide
            tooltip.transition()
                .duration(200)
                .style("opacity", 0);
        };

        // Creates a reference to all the scatterplot dots
        let dots = svg.selectAll("dot").data(data_list_2);

        // Render the dot elements on the DOM
        dots.enter()
            .append("circle")
            .attr("cx", function (d) { return x(d.year); })     
            .attr("cy", function (d) { return y(d.avg); })     
            .attr("r", 4)       
            .style("fill",  function(d){ return color(d.avg); })
            .on("mouseover", mouseover) 
            .on("mouseout", mouseout);

        // Add x-axis label
        svg.append("text")
            .attr("transform", `translate(${(graph_2_width - margin.left - margin.right) / 2},
                                        ${(graph_2_height - margin.top - margin.bottom) +30})`)      
            .style("text-anchor", "middle")
            .style("font-size", "12px")
            .text("Year of Release");

        // Add y-axis label
        svg.append("text")
            .attr("transform", `translate(-80, ${(graph_2_height - margin.top - margin.bottom) / 2})`)       
            .style("text-anchor", "middle")
            .style("font-size", "12px")
            .text('Average Duration');
        svg.append("text")
            .attr("transform", `translate(-80, ${(graph_2_height - margin.top - margin.bottom) / 2 +20})`)     
            .style("text-anchor", "middle")
            .style("font-size", "12px").text("in minutes");

        // Add chart title
        svg.append("text")
            .attr("transform", `translate(${(graph_2_width - margin.left - margin.right) / 2}, ${-20})`)       
            .style("text-anchor", "middle")
            .style("font-size", 15)
            .text(`2️⃣ Average Duration of Movie by Release Year`);
    });





////////////////////////////////////////////////////////////////////////////////////////////


/*  Graph 3: Network Flow */




//////////////////////////////////////////////////////////////////////////////////////////


let svg_flow = d3.select("#graph3")
    .append("svg")
    .attr("width", graph_3_width)
    .attr("height", graph_3_height)
    .append("g")
    .attr("transform", `translate(${-10}, ${margin.top})`);


// Define forces along X and Y axes with custom center and strength values
const forceX = d3.forceX(graph_3_width / 2).strength(0.05);
const forceY = d3.forceY((graph_3_height + margin.top) / 2).strength(0.05); 

// Graph title
let graph_title = svg_flow.append("text")
    .attr("transform", `translate(${(graph_3_width / 2)}, ${-20})`)
    .style("text-anchor", "middle")
    .style("font-size", 15);

// Create D3 forceSimulation for graph
let simulation = d3.forceSimulation()
    .force('x', forceX)
    .force('y',  forceY)
    // Use data id field for links
    .force("link", d3.forceLink().id(function(d) { return d.id; }))  //set field
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter((graph_3_width - margin.right) / 2 +40,
        (graph_3_height - margin.top) / 2));

// Set up color scheme for graph
let color_casts = d3.scaleOrdinal(d3.schemeTableau10);


d3.csv(filename).then(function(data) {
    var data_movie = data.filter(function(d){
        return d.type === "Movie" && d.country === "China" ;
    });
    
    let nodes = [];
    var pair_count = {};
    var cast_movie_cnt = {};
    var links = [];
    var castList = [];
    [pair_count, cast_movie_cnt, links, castList] = getCastConnectionGraph(data_movie);
    let  output_links = [];

    let i = 0;
    // Map each link to an object with source, target, and value fields
    links.forEach(function(a) {
        var cast1 = a[0];
        var cast2 = a[1];
        
        if(cast1 > cast2){
            var tmp = cast1;
            cast1 = cast2;
            cast2 = tmp;
        }
        let html = `<b><u>${a[2]}</u></b><br/> ${cast1} &#8596; ${cast2}`;
        let aStr = "("+cast1+","+cast2+")";
        
        output_links.push({source: cast1, target: cast2, value: pair_count[aStr], html: html, id: i});
        //var leng = output_links.length;
        i++;
    });

    // Map each valid artist to an object with id, group, and count fields
    i = 0;
    castList.forEach(function(a) {
        let group = Math.round(castList.indexOf(a) * (10.0 / castList.length));
        let pair_with_cast = links.filter(function(link) {
            if (link[0] === a || link[1] === a){
                return true;
            }
        });
        
        let cnt = pair_with_cast.length;
        nodes.push({id: a, group: group, count: cnt, idx: i});
        i++;
    });
    // Graph title
    graph_title.text(`3️⃣ Cast Collaboration in Chinese Movies`);
    // Start graph animation
    startFlowGraph({nodes: nodes, links: output_links});

});

let node_size = d3.scaleLinear().range([4, 8]);

function startFlowGraph(graph) {
    // Set up D3 linear scale for the node size based on the number of connections a movie cast has
    node_size.domain(d3.extent(graph.nodes, function(d) { return parseInt(d.count); }));

    // Use graph.links to create lines with width as a function of number of collaborations
    let link = svg_flow.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(graph.links)
        .enter().append("line")
        // Use number of collaborations to get stroke-width
        .attr("stroke-width", "1")
        .attr("id", function(d) { 
            return `link-${d.id}` })
        .on("mouseover", function(d) { flow_mouseover(d, "html", "link") })
        .on("mouseout", function(d) { flow_mouseout(d, "html", "link")} );
    
    // Use graph.nodes to create circles for each movie actor
    let node = svg_flow.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(graph.nodes)
        .enter().append("g");
    node.append("circle")
        // Use number of collaborators to get radius
        .attr("r", function(d) { return node_size(parseInt(d.count)) })
        .attr("fill", function(d) { return color_casts(d.group); })
        .attr("id", function(d) { return `node-${d.idx}` })
        .on("mouseover", function(d) { flow_mouseover(d, "id", 'node') })
        .on("mouseout", function(d) { flow_mouseout(d, "id", 'node') });
    // Set up simulation handlers and simulation link force
    simulation.nodes(graph.nodes).on("tick", ticked);
    simulation.force("link").links(graph.links);

    
    function ticked() {
        link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        node.attr("transform", function(d) {
                // Set up boundary box to prevent animation from going past SVG dimensions
                let radius = Math.round(node_size(parseInt(d.count)));
                d.x = Math.max(radius,
                    Math.min(graph_3_width - radius, d.x));
                d.y = Math.max(radius,
                    Math.min((graph_3_height - margin.top - margin.bottom) - radius, d.y));
                return "translate(" + d.x + "," + d.y + ")";
            });
    }
}
let flow_mouseover = function(d, attr, id) {
    if (id === "node") {
        svg_flow.select(`#node-${d.idx}`).attr("fill", function(d) {
            return darkenColor(color_casts(d.group), 0.8);
        }).attr("r", function(d) {
            return node_size(parseInt(d.count)) * 1.5;
        })
    } else {
        svg_flow.select(`#link-${d.id}`).attr("stroke-width", '5');
    }



    let html = `${d[attr]}`;

    tooltip.html(html)
        .style("left", `${(d3.event.pageX) - 50}px`)
        .style("top", `${(d3.event.pageY) - 100 }px`)
        .style("box-shadow", `2px 2px 5px`)
        .transition()
        .duration(200)
        .style("opacity", 1)
};





function getCastConnectionGraph(data){
    let pair_count = {};
    let cast_movie_count = {}
    let links = [];
    let castSet = new Set();
    var castList = [];
    data.filter(function(d){
        var casts = d.cast
        //console.log("Movie: "+ d.title)
        var casts_list =casts.split(',');
        if (casts_list.length > 1){
            
            for (var i = 0; i < casts_list.length; i++) {
                var cast1 = casts_list[i].trim();
                if (!castSet.has(cast1)) {
                    cast_movie_count[cast1] = 1;
                    castSet.add(cast1);
                }
                else{
                    cast_movie_count[cast1] += 1;
                }
                //console.log("cast: "+cast1 + " for movie "+ d.title)
                for (var j = i+1; j<casts_list.length; j++){
                    var cast2 = casts_list[j].trim();
                    var target, source;
                    //console.log("In loop of cast 2: "+cast2 + " for movie "+d.title)
                    //change order if needed
                    if(cast1 > cast2){
                        source = cast2;
                        target = cast1;
                    }
                    else{
                        source = cast1;
                        target = cast2;
                    }
                    var match = "("+source+","+target+")";
                    links.push([source, target, d.title]);
                    
                    if(match in pair_count ){
                        //console.log("match: "+match + " already exists for "+pair_count[match]+ " times")
                        pair_count[match] += 1;
                        
                    } else {
                        //console.log("match: "+match + " does not exist yet")
                        pair_count[match] = 1;
                    }
                    
                }
            }
        }
        
        castList = [...castSet];
    });
    console.log(pair_count)
    return [pair_count, cast_movie_count, links, castList];
}

function darkenColor(color, percentage) {
    return d3.hsl(color).darker(percentage);
}

