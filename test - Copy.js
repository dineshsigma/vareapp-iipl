var time = new Date();

  const currenttime = time.toLocaleString("en-US", {
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true,
  });
  console.log(currenttime);

  

  let date_ob = new Date();
  let date1 = ("0" + date_ob.getDate()).slice(-2);

  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

  let year = date_ob.getFullYear();

  const date = year + "-" + month + "-" + date1;
  console.log(date);

let options={hour12:false}
  var date2 = new Date();
console.log(date2.toLocaleString('en-US',options));


const date3 = new Date();
console.log(date3.toLocaleTimeString('en-US')) // 12h
console.log(date3.toLocaleTimeString('en-GB')) // 24h
console.log(date3.toLocaleTimeString()) 

var today = new Date();
        var awd=new Date((today.setHours(new Date().getHours() + 8))*1000);

        console.log("dncbjdbvhcfbvhcfbvhjfbvhfbhvfb"+awd)