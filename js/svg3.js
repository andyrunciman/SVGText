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


function CharacterNode(c,svg){
    this.x = 0;
    this.y = 0;
    this.char = c;
    this.width = 0;
    this.height = 0;
    this.nextSibling = null;
    this.previousSibling = null;
    this.svg = svg;
    this.calculateWidth();


}
CharacterNode.prototype = {
    hasChildren:function(){
        return this.children || this.children.length > 0;
    },
    calculateWidth:function(){  
        var node = SVGUtility.createTextNode(this.char,svg);
        this.svg.appendChild(node);
        this.width = node.getBBox().width;
        this.height = node.getBBox().height;
        this.svg.removeChild(node);
        
    }
}

//model for the text container

function Block(text){
    this.model = text || "Default";
    this.rootNode = null; //this is the first container
}

Block.prototype = {
    init:function(svg){ 
        var previousNode = null;
        var currentNode = null;           
        for(var i = 0, len = this.model.length; i < len; i++){       
            currentNode = new CharacterNode(this.model[i],svg); 
            if (this.rootNode === null){
                this.rootNode = currentNode;
                previousNode = currentNode;
                continue; // ignore remaining code
            } 
            previousNode.nextSibling = currentNode;
            currentNode.previousSibling = previousNode;
            previousNode = currentNode;
        }
    }
}
  


function Render(block,svg){
    this.block = block;
    this.containerWidth = 200;
    this.svg = svg;
    this.id = 0;
}
Render.prototype = {
      getNextChunk:function(startingNode){    
        
        var chunkToString = startingNode.char;  
        var chunkWidth = startingNode.width;
        var currentNode = startingNode;
        var nextNode = startingNode.nextSibling;
        while(currentNode.char !== ' ' && nextNode && nextNode.char !== ' '){;
            chunkToString += nextNode.char; //builds a string of the chunk (faster placing..)
            chunkWidth+=nextNode.width;
            currentNode = nextNode;
            nextNode = currentNode.nextSibling;
        }
          
        return {startingNode:startingNode,endingNode:currentNode,chunkWidth:chunkWidth,text:chunkToString};
        //if ending
    },
    placeWords:function(){
        var currentNode = this.block.rootNode;
        var currentLine = 0;
        var xPosInLine = 0;
        var currentWordsOnLine = 0;
        
        do{
            var currentChunk = this.getNextChunk(currentNode);
           
            if(currentChunk.text === " "){
                //if we have a space change the spacing.
                xPosInLine += 5; //word spacing;
                currentNode = currentChunk.endingNode.nextSibling;
            }
            else if(currentChunk.chunkWidth < this.containerWidth - xPosInLine){
                this.createNode(currentChunk.text,xPosInLine,(currentLine+1)*15);
                currentNode = currentChunk.endingNode.nextSibling;
                xPosInLine += currentChunk.chunkWidth;
                currentWordsOnLine++;
                
            }else if (currentChunk.chunkWidth > this.containerWidth - xPosInLine && currentWordsOnLine > 0){
                currentLine++; //start a new line abd try again
                xPosInLine = 0;
                currentWordsOnLine = 0;
                
            }else if(currentChunk.chunkWidth > this.containerWidth){
                //the word is bigger than the line so we need to fit in as much as possible - and at least one charcter
                //look at each character one at a time in the chunk keep adding the character to a new string
                //currentLine++; //start a new line
                
                //we must store at least the first character
                var currentNode = currentChunk.startingNode;
                var currentWidth = 0;
                var nodeText = "";
                do{
                    currentWidth += currentNode.width;
                    nodeText += currentNode.char;
                    currentNode = currentNode.nextSibling; 
                
                }while(currentNode !== currentChunk.endingNode && currentWidth < this.containerWidth);                
                this.createNode(nodeText,0,(currentLine+1)*15);
                currentLine++;
                currentNode = currentNode;
            } 
            
        }while(currentNode !== null);
    },
    createNode(text,x,y){
        this.id++;
        var node = SVGUtility.createTextNode(text,this.svg);
        node.setAttribute('x',x);
        node.setAttribute('y',y);
        node.setAttribute('id',this.id)
        svg.appendChild(node);
    }

}

var svg = document.getElementById('svg');
var block = new Block("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean gravida, ipsum id tempus egestas, dolor turpis tempor ex, sed interdum orci nisl eget turpis. Suspendisse pulvinar orci nisi");
block.init(svg);
var render = new Render(block,svg);
render.placeWords();
var self = this;
var id = 1;
svg.addEventListener('click',function(){
    //render.containerWidth += 10;
    //while (self.svg.lastChild) {
        //self.svg.removeChild(self.svg.lastChild);
    //} 
    //render.placeWords();
    svg.removeChild(document.getElementById(id));
    id++;

})
