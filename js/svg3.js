function SVGUtility(){
    
     
};

SVGUtility.namespace = "http://www.w3.org/2000/svg"; 

SVGUtility.createTextNode = function(text,svg){
    var node = document.createElementNS(SVGUtility.namespace,'text');
    node.textContent = text;
    return node;
}

SVGUtility.createRectange = function(x,y,width,height,svg){
    var rect = document.createElementNS(SVGUtility.namespace,'rect');
    rect.setAttribute('x',x);
    rect.setAttribute('y',y); //as rect should be drawn at the top of the text
    rect.setAttribute('width',width);
    rect.setAttribute('height',height); //bug!
    return rect;
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
        
    },
    containsPoint:function(x,y){  //find the character based on the mouse position.
        if (this.x && this.y && this.width){  //BUG not checking the first char??
            //console.log('mouse x =' + x + "this x ="+ this.x);
            if(x >= this.x && x<=this.x + this.width && y <= this.y && y >= this.y - 15){  //height is a bug as we have hard coded 15
                return this;
                
            }else{
                return null; // we cant find the character
            }
        }
    },
    positionCursor:function(){
        var rect = SVGUtility.createRectange(this.x,this.y-15,this.width,15); //BUG + hardcoded height
        svg.appendChild(rect);
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
    },
    findCharacter:function(x,y){
        
        console.log('looking for character');
        var currentNode = this.rootNode;
        do{
            //console.log('checking character:'+currentNode.char + " at position" + currentNode.x + "," + currentNode.y);
            if(currentNode.containsPoint(x,y)){
                console.log('found character:'+currentNode.char);
                currentNode.positionCursor();
                return;
            }
            currentNode = currentNode.nextSibling;
        }while(currentNode !== null)
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
                //we need to update the positions of the items in this chunk
                this.createNode(currentChunk.text,xPosInLine,(currentLine+1)*15);
                this.updateCharacterCoordintates(currentChunk,xPosInLine,(currentLine+1)*15);
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
                    //we can update the x,y positions at this point to save doing it later.
                    currentNode.x = currentWidth;
                    currentNode.y = (currentLine+1)*15; //this needs moving as it is repeated...
                
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
    },
    updateCharacterCoordintates(chunk,startX,startY){
        
        var offset = 0;
        
        chunk.startingNode.x = startX + offset;
        chunk.startingNode.y = startY;
        
        //get the first node - it may be the last e.g for the word a
        
        while(chunk.startingNode.nextSibling && chunk.startingNode !== chunk.endingNode){
            
            offset += chunk.startingNode.width; 
            
            chunk.startingNode = chunk.startingNode.nextSibling;
            
            chunk.startingNode.x = startX + offset;
            chunk.startingNode.y = startY;
            
           
        }
    }

}
    
function coordinateTransform(screenPoint, someSvgObject)
{
  var CTM = someSvgObject.getScreenCTM();
  return screenPoint.matrixTransform( CTM.inverse() );
}

var svg = document.getElementById('svg');
var block = new Block("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean gravida, ipsum id tempus egestas, dolor turpis tempor ex, sed interdum orci nisl eget turpis. Suspendisse pulvinar orci nisi");
block.init(svg);
var render = new Render(block,svg);
render.placeWords();
var self = this;
var id = 1;
svg.addEventListener('click',function(e){
    //see which letter was clicked on
    
    //get the x and y that was clicked by the mouse and covert them into the svg space
    
    var mouseX = e.clientX;
    var mouseY = e.clientY;
    
    //make a transformation matrix
    
    var point = svg.createSVGPoint();
    point.x = mouseX;
    point.y = mouseY;
    
    var point2 = self.coordinateTransform(point,svg);
    console.log(point);
    console.log(point2);
    
    
    var node = block.rootNode;
    
    console.log('finding character...')
    self.block.findCharacter(point2.x,point2.y); 
    
})
