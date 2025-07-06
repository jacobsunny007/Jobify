var mongoose =require("mongoose");
mongoose.connect("mongodb+srv://jobapp:jobapp@cluster0.yemeiyr.mongodb.net/jobdb?retryWrites=true&w=majority&appName=Cluster0")

.then(()=>{
    console.log("Db connected")
})
.catch((err)=>{
    console.log(err)
})