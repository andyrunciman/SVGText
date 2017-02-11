var text = "Theeeeeeeeeeeeefdjskjfdhjkfhjdhkhfsjkhafkjj cat sat on the mat.     He was as big as a mouse and twice as mean... Oh no dlfkjldsjflkjadksljfkajsdklfjlaksj said the scary cat!"


var container = new Container();
container.width = 200;
container.x = 0;
container.y = 0;


function Container(){
    this.width = 0;
    this.x = 0;
    this.y = 0;
}



function TextModel(text,svg){
    this.text = text;
    this.characters = [];
    this.chunks = []
    
    var self = this;
    var init = function(){
        
        var currentChunk = "";
        var previousCharacter = null;
        
        for (var i = 0; i < text.length; i++){
            
            //make placeable items out of the charactersss
            
            var c = new Character(text[i]);
            var size = calculateSize(text[i],svg);
            
            c.computedWidth = size.width;
            c.computedHeight = size.height;
                 
            //setup the linking between the charcaters
            
            //set the previous characters next character
            if(previousCharacter!=null){
                previousCharacter.nextCharacter = c;
            }
            //set the current characture to the previous
            c.previousCharacter = previousCharacter;
            
            //set the new previous char to the current char
            //ready for the next iteration.
            previousCharacter = c;
    
            self.characters.push(c);
        }
    }
    
    init();
}

function Character(c){
    //this holds information about the character
    this.character = c;
    this.nextCharacter = null;
    this.previousCharacter = null;
    this.parent = null;
    this.computedWidth = 0;
    this.computedHeight = 0;
    this.x = 0;
    this.y = 0;
    this.style ={};
    this.selected = false;
    
}

function calculateSize(c,svg){
    var el = CreateSVGElement.textElement(c);
    svg.appendChild(el);
    var width = el.getBBox().width;
    var height = el.getBBox().height;
    svg.removeChild(el);
    return {width:width,height:height};
}


var linewidth  = 100;

function renderText(textModel,container,svg){
    
    var c = textModel.characters[0];
    
 
    var currentWord = "";
    var currentWordLength = 0;

    var lineheight = 30;
    var x = 0;
    var y = 30;
    
    
    
    var wordcount = 0; //this is used to see if we only have a single
    //word on a line... if this is bigger that the width of the box, we will have to split it rather than allowing it to break to the next line.
    
    //what do we do about one really ling first word or series of spaces?
    
    while(c !== null){
        if(c.character !== ' '){
            currentWord += c.character;
            currentWordLength += c.computedWidth;
        }
        
        if (c.character === ' ' || c.nextCharacter === null){
            //if we have a current word, try and write it
            if(currentWord.length>0){
                //if we have room write the word
                wordcount++;
                
                if (x + currentWordLength > linewidth &&  wordcount > 1){
                    
                    y = y + lineheight; //start a new line
                    x = 0;              //place x back at the start
                    
                    var el = CreateSVGElement.textElement(currentWord,{x:x,y:y});
                    svg.appendChild(el);
                    
                    x = x + currentWordLength + 5; //move to the next split

                    currentWordLength =0;  
                    currentWord = "";
                    wordcount = 0;
                    
                }else if (x + currentWordLength > linewidth &&  wordcount === 1){
                    
                    
                    var availableSpace = linewidth - x;
                    console.log("Available Space: " +availableSpace);
                    
                    //go backwards through the charcters removing the letters
                    console.log("CurrentWordLength Space: " +currentWordLength);
                    while(currentWordLength > availableSpace){
                        c = c.previousCharacter;
                        currentWordLength = currentWordLength - c.computedWidth;
                        currentWord = currentWord.slice(0,currentWord.length -1);
                       
                    }
                
                    
                    var el = CreateSVGElement.textElement(currentWord,{x:x,y:y});
                    svg.appendChild(el);
                    
                   
                    //get rid of the frist letter and start a new line
                    
                    y = y + lineheight; //start a new line
                    x = 0;              //place x back at the start 
                    wordcount = 0;
                    currentWord = "";
                    currentWordLength = 0;
                }
                else{
                    var el = CreateSVGElement.textElement(currentWord,{x:x,y:y});
                    svg.appendChild(el);
                    x = x + currentWordLength + 5; //move to the next spit
                    currentWordLength =0;
                    currentWord = "";
                } 
                
            }else{ //we may have multiple spaces
                //if (x + c.computedWidth > 100){
                  //  y = y + lineheight; //start a new line
                    //x = c.computedWidth;              //place x back at the start       
                //}
            }
            
        }
        c = c.nextCharacter;
    }
    
}



//create SVG Elements
function CreateSVGElement(){
    
}

CreateSVGElement.namespace = 'http://www.w3.org/2000/svg';

CreateSVGElement.textElement = function(text,options){
    
    //add error
    var el = document.createElementNS(this.namespace,'text');
    el.textContent = text;
    for (var opt in options){
        el.setAttribute(opt,options[opt]);
    }
    return el;
}

CreateSVGElement.groupElement = function(options){
    
    //add error
    var el = document.createElementNS(this.namespace,'group');
    for (var opt in options){
        el.setAttribute(opt,options[opt]);
    }
    return el;
}


var svg = document.getElementById('svg');
var textModel = new TextModel(text,svg);
renderText(textModel,null,svg);
self = this;

svg.addEventListener('click',function(){
    self.linewidth += 10;
    while (self.svg.lastChild) {
    self.svg.removeChild(svg.lastChild);
    }
    self.renderText(textModel,null,svg);
})

