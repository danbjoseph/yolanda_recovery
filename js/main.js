var width = $(window).width() - 15,
    height = 305;

var projection = d3.geo.mercator()
    .scale(5000)
    .center([124,11])
    .translate([width / 2, height / 2]);

fitProjection(projection, phlBoundingBox, [[0,0],[width, height]]);

var path = d3.geo.path()
    .projection(projection);

var zoom = d3.behavior.zoom()
    .translate([0, 0])
    .scale(1)
    .scaleExtent([0, 17])
    .on("zoom", zoomed);

var formatCommas = d3.format(",");

function zoomed() {
  provinceGroup.style("stroke-width", 1.2 / d3.event.scale + "px");
  municipGroup.style("stroke-width", 1 / d3.event.scale + "px");
  brgyGroup.style("stroke-width", 1 / d3.event.scale + "px");
  provinceGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  municipGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  brgyGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

var svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height);

var provinceGroup = svg.append('g').attr("id", "province-mapped");
var municipGroup = svg.append('g').attr("id", "municip-mapped");
var brgyGroup = svg.append('g').attr("id", "brgy-mapped");

svg
    // .call(zoom) // delete this line to disable free zooming
    .call(zoom.event);

function d3Start(){
  d3.json("data/admin1.json", function(data) {
    provinceData = topojson.feature(data, data.objects.admin1).features;
    provinceGroup.selectAll("path")
      .data(provinceData)
      .enter().append("path")
      .attr("d",path)
      .on("click",clickedProvince)
      .on("mouseover", function(d){ 
        var tooltipText = "<strong>" + d.properties.name_1 + "</strong>";
        $('#tooltip').append(tooltipText);                
      })
      .on("mouseout", function(){ 
         $('#tooltip').empty();        
      });
    $("#loading").fadeOut(300);
    $("#livelihood").click();
  }); 
}

var municipData;
var brgyData;

d3.json("data/municipData_empty.json", function(data) {
  municipData = data;
});
d3.json("data/brgyData_empty.json", function(data) {
  brgyData = data;
});

var livelihoodData = [];
var shelterData = [];
var healthData = [];
var watsanData = [];
var educationData = [];

var indicatorList = [];
var partnerList = [];
var partnerButtons;

// adds "PH" to start of p-code in activity data so that format matches spatial data attributes
function addPH(data){
  $(data).each(function(index, record){
    record.Admin2 = "PH"+record.Admin2;
    record.Admin3 = "PH"+record.Admin3;
    record.Admin4 = "PH"+record.Admin4;
  });
  return data;
}

function loadSector(sector, target){
  d3.select("#sector-options").selectAll(".btn").classed("active", false);
  d3.select(target).classed("active", true);
  if(sector === "livelihood"){
    indicatorList = [
      "HH Support Beneficiaries Selected", 
      "First Installment", 
      "Second Installment"
    ]; 
    if(livelihoodData.length === 0){
      $("#loading").show();
      d3.csv("data/recovery_livelihood.csv", function(data) { 
        livelihoodData = addPH(data);
        $("#loading").fadeOut(300);
        parsePartners(); 
      });
    } else {
      parsePartners();
    }    
  }
  if(sector === "shelter"){
    indicatorList = [
      "Shelter Repair Beneficiaries Selected",
      "First Distribution (6,000 PHP)",
      "Second Distribution (4,000 PHP)",
      "CGI",
      "Shelter Repair Closeout / Completed",
      "Core Shelter Beneficiaries Selected",
      "Construction Started",
      "Wooden Shelter (Core Shelter)",
      "Half Concrete (Core Shelter)"
    ]; 
    if(shelterData.length === 0){
      $("#loading").show();
      d3.csv("data/recovery_shelter.csv", function(data) { 
        shelterData = addPH(data);
        $("#loading").fadeOut(300);
        parsePartners(); 
      });
    } else {
      parsePartners();
    }    
  }
  if(sector === "health"){
    indicatorList = [
      "Facility Selected",
      "Rehab / Construction Started",
      "Facility Equipped",
      "Construction & Handover Completed",
      "Community Selected",
      "# Households in Targeted Community",
      "Facilitators Trained",
      "CHVs Trained",
      "Distributed Kits",
      "Women of Reproductive age reached w/ Maternal and Childcare Promotion",
      "PSP to Affected Sessions Conducted",
      "Volunteers trained as Facilitators on PSP-RFL",
      "Individuals Reached",
      "PSP for Humanitarians Sessions Conducted",
      "Humanitarians Reached"
    ]; 
    if(healthData.length === 0){
      $("#loading").show();
      d3.csv("data/recovery_health.csv", function(data) { 
        healthData = addPH(data);
        $("#loading").fadeOut(300);
        parsePartners(); 
      });
    } else {
      parsePartners();
    }    
  }
  if(sector === "education"){
    indicatorList = [
      "Classrooms Selected at School",
      "Students covered by rehab / constructed classrooms",
      "Classrooms Completed and Equipped",
      "5.2 Distribution of School Kits"
    ]; 
    if(educationData.length === 0){
      $("#loading").show();
      d3.csv("data/recovery_education.csv", function(data) { 
        educationData = addPH(data);
        $("#loading").fadeOut(300);
        parsePartners(); 
      });
    } else {
      parsePartners();
    }    
  }
  if(sector === "watsan"){
    indicatorList = [
      "Core Shelter Latrines",
      "Relocation Latrines",
      "Reached w/ Hygiene Promotion (PHAST)",
      "Schools Selected",
      "School Latrine Construction Completed",
      "Reached w/ HP (CHAST)",
      "ECCD Selected",
      "ECCD latrine Construction Completed",
      "People Reached w/ CHAST",
      "# of Hygiene Kit Distributed"
    ]; 
    if(watsanData.length === 0){
      $("#loading").show();
      d3.csv("data/recovery_watsan.csv", function(data) { 
        watsanData = addPH(data);
        $("#loading").fadeOut(300);
        parsePartners(); 
      });
    } else {
      parsePartners();
    }    
  }    
}

//rebuild partners buttons
function parsePartners() {
  partnerList = [];
  $(currentSectorData()).each(function(index, record){
    var partnerName = record.Partner;
    if (partnerList.indexOf(partnerName) === -1){
        partnerList.push(partnerName);
    }; 
  });
  var partnerFilterHtml = '<button id="ALL-PARTNERS" class="btn btn-sm btn-donor filtering all" type="button" onclick="togglePartnerFilter('+"'ALL-DONORS'"+', this);"'+
      ' style="margin-right:10px;">All<span class="glyphicon glyphicon-check" style="margin-left:4px;"></span></button>';
  partnerList.sort();
  $.each(partnerList, function(index, partner){
    var itemHtml = '<button id="'+partner+'" class="btn btn-sm btn-donor" type="button" onclick="togglePartnerFilter('+"'"+partner+"'"+', this);">'+partner+
        '<span class="glyphicon glyphicon-unchecked" style="margin-left:4px;"></span></button>';
    partnerFilterHtml += itemHtml;    
  });
  $('#partnerButtons').html(partnerFilterHtml);
  partnerButtons = $("#partnerButtons").children(); 
  changePartnerFilter();
}

var selectedPartners = [];

function changePartnerFilter(){
  selectedPartners = [];
  provinceList = {};
  municipList = {};
  brgyList = {};
  $.each(partnerButtons, function(i, button){
    if($(button).hasClass("filtering")){
      var buttonid = $(button).attr("id");
      selectedPartners.push(buttonid);
    }
  });
  $(currentSectorData()).each(function(index, record){
    if(selectedPartners.indexOf(record.Partner) != -1  || selectedPartners.indexOf("ALL-PARTNERS") != -1 ){
      provinceList[record.Admin2] = record.prov;
      municipList[record.Admin3] = record.municip;
      brgyList[record.Admin4] = record.brgy; 
    }    
  });
  colorProvinces();
  colorMunicip();
  colorBrgy();
  createTable();
}

var loadedProvinces = [];
var loadedMunicipalities = [];

function clickedProvince(d) {    
  provinceGroup.selectAll("path").classed("active", false);
  municipGroup.selectAll("path").classed("active", false);
  brgyGroup.selectAll("path").classed("active", false);  
  d3.select(this).classed("active", true);
  // load data if needed
  if($.inArray(d.properties.PCODE_PH1, loadedProvinces) === -1){
    $("#loading").show();   
    loadedProvinces.push(d.properties.PCODE_PH1);
    var fileUrl = "data/geo/" + d.properties.PCODE_PH1 + ".json";
    d3.json(fileUrl, function(data) {
      $.each(data.features, function(index, feature){
        municipData.features.push(feature);
      });         
      drawMunicipalities(d);
    });
  } else {
    drawMunicipalities(d);
  }
}

function clickedMunicip(d){  
  municipGroup.selectAll("path").classed("active", false);
  brgyGroup.selectAll("path").classed("active", false);
  d3.select(this).classed("active", true);
  // load data if needed
  if($.inArray(d.properties.PCODE_PH2, loadedMunicipalities) === -1){
    $("#loading").show(); 
    loadedMunicipalities.push(d.properties.PCODE_PH2);
    var fileUrl = "data/geo/" + d.properties.PCODE_PH2 + ".json";
    d3.json(fileUrl, function(data) {
      $.each(data.features, function(index, feature){
        brgyData.features.push(feature);
      });         
      drawBarangays(d);
    });
  } else {
    drawBarangays(d);
  }
}

function drawMunicipalities(d){
  brgyGroup.selectAll("path").remove();  
  var clickedPcode = d.properties.PCODE_PH1;
  var bounds = path.bounds(d),
    dx = bounds[1][0] - bounds[0][0],
    dy = bounds[1][1] - bounds[0][1],
    x = (bounds[0][0] + bounds[1][0]) / 2,
    y = (bounds[0][1] + bounds[1][1]) / 2,
    scale = .9 / Math.max(dx / width, dy / height),
    translate = [width / 2 - scale * x, height / 2 - scale * y];
  svg.transition()
      .duration(750)
      .call(zoom.translate(translate).scale(scale).event);
  var municipDisplay = municipGroup.selectAll("path")
      .data(municipData.features.filter(function(d) {return d.properties.PCODE_PH1 === clickedPcode;}), function(d) { return d.properties.PCODE_PH2; });
  municipDisplay.enter().append("path")
      .attr("d",path).on("click",clickedMunicip)
      .on("mouseover", function(d){ 
        var tooltipText = d.properties.name_2 + ", " + d.properties.name_1;
        $('#tooltip').append(tooltipText);                
      })
      .on("mouseout", function(){ 
         $('#tooltip').empty();        
      });
  municipDisplay.exit().remove();
  $("#loading").fadeOut(400);
  colorMunicip();
  createTable();
}

function drawBarangays(d){   
  var clickedPcode = d.properties.PCODE_PH2;
  var bounds = path.bounds(d),
      dx = bounds[1][0] - bounds[0][0]+5,
      dy = bounds[1][1] - bounds[0][1]+5,
      x = (bounds[0][0] + bounds[1][0]) / 2,
      y = (bounds[0][1] + bounds[1][1]) / 2,
      scale = .9 / Math.max(dx / width, dy / height),
      translate = [width / 2 - scale * x, height / 2 - scale * y];
  svg.transition()
      .duration(750)
      .call(zoom.translate(translate).scale(scale).event);  
  var brgyDisplay = brgyGroup.selectAll("path")
      .data(brgyData.features.filter(function(d) {return d.properties.PCODE_PH2 === clickedPcode;}), function(d) { return d.properties.PCODE_PH3; });
  brgyDisplay.enter().append("path").attr("d",path)
      .on("mouseover", function(d){ 
        var tooltipText = d.properties.name_3 + ", " + d.properties.name_2 + ", " + d.properties.name_1;
        $('#tooltip').append(tooltipText);                
      })
      .on("mouseout", function(){ 
         $('#tooltip').empty();        
      });
  brgyDisplay.exit().remove();
  $("#loading").fadeOut(400);
  colorBrgy();
  createTable();
}

var totalRow = {};
var breakdownRows = {};

function createTable(){
  var activePcode = "ALL";
  var activeName = "Haiyan Operation";  
  provinceGroup.selectAll(".active").each(function(d,i){
    activePcode = d.properties.PCODE_PH1;
    activeName = d.properties.name_1;
    municipGroup.selectAll(".active").each(function(d,i){
      activePcode = d.properties.PCODE_PH2;
      activeName = d.properties.name_2;
    });
  });
  totalRow = {};
  breakdownRows = {};    
  totalRow[activePcode] = { 'name' : activeName };
  $.each(indicatorList, function(index, indicator){
    totalRow[activePcode][indicator] = 0;
  });  
  $(currentSectorData()).each(function(index, record){
    if(selectedPartners.indexOf(record.Partner) != -1  || selectedPartners.indexOf("ALL-PARTNERS") != -1 ){
      // operation overview
      if("ALL" === activePcode){
          if(breakdownRows.hasOwnProperty(record.Admin2) === false){
            breakdownRows[record.Admin2] = { 'name' : record.prov };
            $.each(indicatorList, function(index, indicator){
              breakdownRows[record.Admin2][indicator] = 0;
            });
          }
          $.each(indicatorList, function(index, indicator){
            if(isFinite(parseInt(record[indicator]))){
              totalRow[activePcode][indicator] += parseInt(record[indicator]);
              breakdownRows[record.Admin2][indicator] += parseInt(record[indicator]);
            }
          });        
      }
      // province active
      if(record.Admin2 === activePcode){
        if(breakdownRows.hasOwnProperty(record.Admin3) === false){
          breakdownRows[record.Admin3] = { 'name' : record.municip };
          $.each(indicatorList, function(index, indicator){
            breakdownRows[record.Admin3][indicator] = 0;
          });
        }
        $.each(indicatorList, function(index, indicator){
          if(isFinite(parseInt(record[indicator]))){
            totalRow[activePcode][indicator] += parseInt(record[indicator]);
            breakdownRows[record.Admin3][indicator] += parseInt(record[indicator]);
          }
        });
      }
      // muncip active
      if(record.Admin3 === activePcode){
        if(breakdownRows.hasOwnProperty(record.Admin4) === false){
          breakdownRows[record.Admin4] = { 'name' : record.brgy };
          $.each(indicatorList, function(index, indicator){
            breakdownRows[record.Admin4][indicator] = 0;
          });
        }
        $.each(indicatorList, function(index, indicator){
          if(isFinite(parseInt(record[indicator]))){
            totalRow[activePcode][indicator] += parseInt(record[indicator]);
            breakdownRows[record.Admin4][indicator] += parseInt(record[indicator]);
          }
        });
      }
    }
  });

  $("#sector-accomplished_headers").empty();
  $("#sector-accomplished_content").empty();

  $("#sector-accomplished_headers").append("<th></th>");
  var columnCount = 0;
  $.each(indicatorList, function(index, indicator){
    columnCount ++;
    $("#sector-accomplished_headers").append("<th>" + indicator + "</th>");
  });
  $("#sector-accomplished colgroup").html('<col style="width:20%">');
  var columnWidth = 80 / columnCount;
  for(i=0; i<columnCount; i++){
    $("#sector-accomplished colgroup").append('<col style="width:' + columnWidth.toString() + '%">');
  }

  for(x in totalRow){
    var thisHtml = '<tr class="danger totalRow"><td>' + totalRow[x]['name'] + "</td>";
    $.each(indicatorList, function(index, indicator){
      thisHtml += "<td>" + formatCommas(totalRow[x][indicator]) + "</td>";
    });
    thisHtml += "</tr>";
    $("#sector-accomplished_content").append(thisHtml);
  }
  for(x in breakdownRows){
    var thisHtml = "<tr><td>" + breakdownRows[x]['name'] + "</td>";
    $.each(indicatorList, function(index, indicator){
      thisHtml += "<td>" + formatCommas(breakdownRows[x][indicator]) + "</td>";
    });
    thisHtml += "</tr>";
    $("#sector-accomplished_content").append(thisHtml);
  }

}

var provinceList = {};
var municipList = {};
var brgyList = {};

function colorProvinces(){
  provinceGroup.selectAll("path").attr("fill", null);
  for(entry in provinceList){
    provinceGroup.selectAll("path")
        .filter(function(d) {return d.properties.PCODE_PH1 == entry})
        .attr('fill',"#ed1b2e");
  }
}

function colorMunicip(){
  municipGroup.selectAll("path").attr("fill", null);
  for(entry in municipList){
    municipGroup.selectAll("path")
        .filter(function(d) {return d.properties.PCODE_PH2 == entry})
        .attr('fill',"#f03f4f");
  }
}

function colorBrgy(){
  brgyGroup.selectAll("path").attr("fill", null);
  for(entry in brgyList){
    brgyGroup.selectAll("path")
        .filter(function(d) {return d.properties.PCODE_PH3 == entry})
        .attr('fill',"#f36471");
  }  
}

function currentSectorData(){
  var activeSector = $('#sector-options').find('.active').attr('id');
  if(activeSector === "livelihood"){
    return livelihoodData;
  }
  if(activeSector === "shelter"){
    return shelterData;
  }
  if(activeSector === "education"){
    return educationData;
  }
  if(activeSector === "watsan"){
    return watsanData;
  }
  if(activeSector === "health"){
    return healthData;
  }
}

function togglePartnerFilter (filter, element) {
  if($(element).hasClass("filtering") !== true){
  // if clicked element is off turn every button off and turn clicked on   
    $.each(partnerButtons, function(i, button){
      $(button).children().removeClass("glyphicon-check");
      $(button).children().addClass("glyphicon-unchecked");
      $(button).removeClass("filtering");
    });
    $(element).children().removeClass("glyphicon-unchecked"); 
    $(element).children().addClass("glyphicon-check");
    $(element).addClass("filtering");         
  } else {
  // if clicked element is on turn it off and turn 'all' filter on
    $.each(partnerButtons, function(i, button){
      $(button).children().removeClass("glyphicon-check");
      $(button).children().addClass("glyphicon-unchecked");
      $(button).removeClass("filtering");
    });
    var partnerAllFilter = $('#partnerButtons').find('.all');
    $(partnerAllFilter).children().removeClass("glyphicon-unchecked"); 
    $(partnerAllFilter).children().addClass("glyphicon-check");
    $(partnerAllFilter).addClass("filtering");
  }
  changePartnerFilter();
}

// tooltip follows cursor
$(document).ready(function() {
    $('#map').mouseover(function(e) {        
        //Set the X and Y axis of the tooltip
        $('#tooltip').css('top', e.pageY + 10 );
        $('#tooltip').css('left', e.pageX + 20 );         
    }).mousemove(function(e) {    
        //Keep changing the X and Y axis for the tooltip, thus, the tooltip move along with the mouse
        $("#tooltip").css({top:(e.pageY+15)+"px",left:(e.pageX+20)+"px"});        
    });
});

function zoomOut() {
  brgyGroup.selectAll("path").remove();
  
  var activeMunicip = false;
  municipGroup.selectAll(".active").each(function(d){
    activeMunicip = true;
  });

  if(activeMunicip === true){
      provinceGroup.selectAll(".active").each(function(d){
      municipGroup.selectAll("path").classed("active", false);
      drawMunicipalities(d);
    });
  } else {
    provinceGroup.selectAll("path").classed("active", false);
    municipGroup.selectAll("path").remove();
    changePartnerFilter();
    svg.transition()
      .duration(750)
      .call(zoom.translate([0, 0]).scale(1).event);
  }
}

d3.select(window).on('resize', resize);

function resize() {
  // adjust things when the window size changes
  width = $(window).width();
  // update projection
  var activeMunicip = [];
  municipGroup.selectAll(".active").each(function(d){
    activeMunicip.push(d);
  });
  var activeProvince = [];
  provinceGroup.selectAll(".active").each(function(d){
    activeProvince.push(d);
  });

  if (activeMunicip.length !== 0){
    fitProjection(projection, phlBoundingBox, [[0,0],[width, height]]);
    municipGroup.selectAll(".active").each(function(d){
      var clickedPcode = d.properties.PCODE_PH1;
      var bounds = path.bounds(d),
      dx = bounds[1][0] - bounds[0][0],
      dy = bounds[1][1] - bounds[0][1],
      x = (bounds[0][0] + bounds[1][0]) / 2,
      y = (bounds[0][1] + bounds[1][1]) / 2,
      scale = .9 / Math.max(dx / width, dy / height),
      translate = [width / 2 - scale * x, height / 2 - scale * y];
      svg.transition()
       .duration(750)
       .call(zoom.translate(translate).scale(scale).event); 
    });
  } else if (activeProvince.length !== 0) {
    fitProjection(projection, phlBoundingBox, [[0,0],[width, height]]);
    provinceGroup.selectAll(".active").each(function(d){
      var clickedPcode = d.properties.PCODE_PH1;
      var bounds = path.bounds(d),
      dx = bounds[1][0] - bounds[0][0],
      dy = bounds[1][1] - bounds[0][1],
      x = (bounds[0][0] + bounds[1][0]) / 2,
      y = (bounds[0][1] + bounds[1][1]) / 2,
      scale = .9 / Math.max(dx / width, dy / height),
      translate = [width / 2 - scale * x, height / 2 - scale * y];
      svg.transition()
        .duration(750)
        .call(zoom.translate(translate).scale(scale).event);
    });
  } else {
    fitProjection(projection, phlBoundingBox, [[0,0],[width, height]]);
  }
  // resize the map container
  svg.style('width', width + 'px');
  // resize the map
  svg.selectAll('path').attr('d', path);
}
 
// show disclaimer text on click of dislcaimer link
function showDisclaimer() {
  window.alert("Program data is subject to change. Data may be incomplete. For official reports please refer to documents published by the Philippine Red Cross and/or IFRC. The maps on this page do not imply the expression of any opinion concerning the legal status of a territory or of its authorities.");
}

d3Start();