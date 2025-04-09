
let baseItems = []
var localItems = []
let estadoActual  = []

const selected_file = "/var/environment/custom_app_manager/conf/custom_app_selected.json"



let getSelectedFilePromise = function getSelectedFile(){
    return new Promise((resolve, reject) => {
        cockpit.file(selected_file).read()
        .then((content, tag) => {
            if(content){
              console.log("reading file finish")
              resolve(content);
            }
        }).catch(error => {
            reject('Rejected')
        });
    
    
    
      });
    };

// let getEnvironmentVariablesFromLocalFilePromise = function getVariablesData(){
//       return new Promise((resolve, reject) => {
//           cockpit.file(ui_file).read()
//           .then((content, tag) => {
          
//             resolve(content);
              
//           }).catch(error => {
//               console.log(error)
//               reject('Rejected')
//           });
      
      
      
//         });
//       };  
      
 
function replaceContentFile(content){
  var replaceContent = ""
   content.forEach(element => {
    nline =element + "\n"
    replaceContent += nline 

  })

   console.log(replaceContent)
   cockpit.file(localFile).replace(replaceContent)
   .then((content, tag) => {
    console.log(content)
    console.log(tag)
   
    
   }).catch(error => {
       console.log(error)
   });
}