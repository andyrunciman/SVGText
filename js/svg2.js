function SVGUtility(){
    
     
};

SVGUtility.namespace = "http://www.w3.org/2000/svg"; 

SVGUtility.createTextNode = function(text,svg){
    var node = document.createElementNS(SVGUtility.namespace,'text');
    node.textContent = text;
    return node;
}

SVGUtility.measure = function(node,svg){  
    svg.appendChild(node);
    var width = node.getBBox().width;
    var height = node.getBBox().height;
    svg.removeChild(node)
    return {width:width,height:height};
};



//need an interface for layoutcontainers
//a container would have an x,y position
//and children. The children would either
//be another layoutcontainer or a character 

function LayoutContainer(){
    this.x = 0;
    this.y = 0;
    this.char = null;
    this.width = 0;
    this.height = 0;
    this.name = 'default'
    this.style = {}; //this could contain a css style so that children could inherit it
    this.nextSibling = null;
    this.previousSibling = null;
    this.parent = null;
    this.children = [];
}
LayoutContainer.prototype = {
    hasChildren:function(){
        return this.children || this.children.length > 0;
    }
}

//model for the text container

function SVGModel(model){
    this.model = model || "Default";
    this.layoutContainer = null; //this is the first container   
}

SVGModel.prototype = {
    firstPassModel:function(){ //this functions sets out the model for the first time
        //do we have a first pass that just sets the relationships
        this.layoutContainer = new LayoutContainer();
        //push a paragraph to the new container...
        
        var paragraph1 = new LayoutContainer();
        paragraph1.name = "paragraph"; //this should prob be an enumeration??
        paragraph1.parent = this.layoutContainer;
        
        this.layoutContainer.children.push(paragraph1);
        
    
        var previousNode = null;
        var currentNode = null;
             
        for(var i = 0, len = this.model.length; i < len; i++){
               
            currentNode = new LayoutContainer();
            currentNode.char = this.model[i];
            
            if (previousNode !== null){
                previousNode.nextSibling = currentNode;
                currentNode.previousSibling = previousNode;
            }           
            previousNode = currentNode;
            
            paragraph1.children.push(currentNode);
            
        }
    },
    secondPassModel:function(svg){  //this uses an SVG to provide sizing data required
        //starting at the top of the model 
        //begin to build up the positions.
        var container = this.layoutContainer;
        
        //look through each of the children - build up the size of each layout node
        //the size of the container is irrelevant as it is the svg container size
        //that will cause the text to wrap.
        
        this.measureContainers(container,svg);
        
        
    },
    measureContainers(container,svg){
        if(container.char !== null && container.char !== " "){
            var node = SVGUtility.createTextNode(container.char,svg);
            var measure = SVGUtility.measure(node,svg);
            container.width = measure.width;
            container.height= measure.height;
        }else if(container.char === " "){
            container.width = 5;
            container.height = 0;
        }else{ 
            for (var i = 0; i < container.children.length; i++){
                this.measureContainers(container.children[i],svg);
            }
        }
    }
}

//the layout model, takes some html and builds a layout model 
//that can be rendered on screen

function SVGController(){
    
    //take the text
    //create the layout nodes which can be used to build the svg graphic

    //does this consume the mouse events and update the model?
    
}


function SVGView(layoutContainer,svg){
    //uses a Layout Model and builds/ renders the SVG Graphic
    
    //this will nottify the layout model if something has changed
    
    //the layout model (which may turn out to be a controller) will
    
    //update the model and ask this to re-render.
    
    
    //methods
    
    //measure character
    //uses the current svg to measure the character 
    
    //look at each parapgraph and render the text
    
    var lines = [];
    var line = [];
    var currentLine = {
        length:0,
        numberofwords:0,
        currentChars:[],
        currentX:0, 
        maxHeight:0};
    var lineLength = 40;
    var lineHeight = 30;
    var wordspacing = 5;
    
    for (var i = 0; i < layoutContainer.children.length; i++){
        //create a new paragraph
        //start setting out the characters.
        //build words
        var currentContainer = layoutContainer.children[i].children[0];
        var currentWord = [];
        do{
           if(currentContainer.char !== ' '){
               currentWord.push(currentContainer);
           }else{
               if(currentWord.length>0){ //only place the word if we have one
                   placeWord(currentWord);
                   currentWord = [];
               }       
               placeWord([currentContainer]); //place the space as they may have several spaces
               //we dont place these in nodes.
           }   
        }while((currentContainer = currentContainer.nextSibling)!==null);
        
        //push any lines that are left over 
        
        lines.push(currentLine.currentChars);
        
        console.log(lines);
        
        renderLines();
        
    }
           
    function placeWord(wordContainer){
        var availableSpace = lineLength - currentLine.length; 
        var currentWordLength = 0;
        
        for(var i = 0; i < wordContainer.length; i++){
            currentWordLength += wordContainer[i].width;
            if(currentWordLength > availableSpace && currentLine.numberofwords === 0){
                lines.push(wordContainer.slice(0,i)); //dont add the current letter!
                
                //add this character to the next line and continue adding to it
                //on the next iteration
                currentLine.length = wordContainer[i].width;
                currentWordLength = wordContainer[i].width; 
                
                currentLine.numberofwords = 0; //still zero as we are expecting more letters
                //from the long word!
                currentLine.currentChars = [wordContainer[i]]; 
                
                currentWordLength = wordContainer[i].width 
             
                
            }else if(currentWordLength > availableSpace && currentLine.numberofwords > 0){
                //even if we have another long word, it has to fit so far as at least one
                //charcter of space has been taken by the other word (we know we have at least one)
                lines.push(currentLine.currentChars);
                currentLine.length = currentWordLength; //make the next line the same
                //size as the characters we have so far
                currentLine.numberofwords = 0; // we still may not have finished the word, this will only increase after we have full placed the word.
                currentLine.currentChars = wordContainer.slice(0,i);
            }else{
                wordContainer[i].x = currentLine.length;
                wordContainer[i].y = (lines.length + 1) * lineHeight; //0 no good for spacing.
                currentLine.currentChars.push(wordContainer[i]);//add the next element
                //to the array
                
                if(wordContainer[i].char == " "){
                    currentLine.length += wordspacing; 
                }else{
                    currentLine.length += wordContainer[i].width;
                }
            
            }
        }
        currentLine.numberofwords++ ; // we have placed a word so we can wait for the next
    }
    
        function renderLines(){
            var currentWord = "";
            for (var i = 0; i < lines.length; i++){
                for(var j = 0; j < lines[i].length; j++){
                    if(lines[i][j].char === " " && currentWord !== ""){
                        var node = SVGUtility.createTextNode(currentWord,svg);
                        node.setAttribute('x',lines[i][j].x);
                        node.setAttribute('y',lines[i][j].y);
                        svg.appendChild(node);
                        currentWord = "";
                    }else{
                        currentWord += lines[i][j].char;
                    }
                }
            }
    };
    
    
}



var svg = document.getElementById('svg');
var newModel = new SVGModel("The cat animal.");
newModel.firstPassModel();
newModel.secondPassModel(svg);
var svgView = new SVGView(newModel.layoutContainer,svg);
