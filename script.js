const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion-list .suggestion");
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector("#delete-chat-button");


//use free google gemini API to generate response of the outgoing message
const API_KEY = "AIzaSyD41DnCRfZiPLcXFmyJ3RE_mJwcNcJBhSc";
const API_URL =    `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;


let userMessage = null;
let isResponseGenerating  = false;


//create a new message element and return     
//...classes  is used for Adding all passed classes
const createMessageElement = (content, ...classes) =>{
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
}

//Show typing effects by displaying words one by one
const showTypingEffect = (text, textElement, incomingMessageDiv) =>{
    const words = text.split(' ');
    let currentWordIndex = 0;
    
    const typingInterval = setInterval(() =>{
        //Append each word to the text element with a space
        textElement.innerHTML += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex++];
        incomingMessageDiv.querySelector(".icon").classList.add("hide");
        
        //If all words are displayed
        if(currentWordIndex === words.length) {
            clearInterval(typingInterval);

            
            isResponseGenerating = false;

            //Hidding the copy button when gemini responds
            incomingMessageDiv.querySelector(".icon").classList.remove("hide");

            //saving the chats in the local storage
            localStorage.setItem("savedChats", chatList.innerHTML);

        }
        // Scroll to the bottom
        chatList.scrollTo(0,chatList.scrollHeight);
    }, 75)


}


//Fetch response from the API based on user message
const generateAPIResponse = async(incomingMessageDiv) =>{
    const textElement = incomingMessageDiv.querySelector(".text");    //get text element

    //send a POST request to the API with the user's message
    try{
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{ text: userMessage}]
                }]
            })
        })

        const data = await response.json();

        //Error handling and add some styling for small screens
        if(!response.ok) throw new Error(data.error.message);


        //Get the API response text and remove asterisks from it (replace wala part astrisks remove kar raha hai);
        const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, '$1');

        showTypingEffect(apiResponse, textElement, incomingMessageDiv);
        // console.log(apiResponse);
        // textElement.innerText = apiResponse;
    } 
    catch(error){
        isResponseGenerating = false;
        // console.log(error);
        
        textElement.innerText = error.message;  //Error handling
        textElement.classList.add("error");     //Error handling
    }
    finally{
        incomingMessageDiv.classList.remove("loading");
    }
}

//show a loading animation while waiting for the API response
const showLoadingAnimation = () => {
    const html = `<div class="message-content">
                <img src="images/gemini.svg" alt="gemini image" class="avatar">
                <p class="text"></p>
                <div class="loading-indicator">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                </div>
            </div>
            <span onclick="copyMessage(this)"  class="icon material-symbols-outlined">content_copy</span>`;

    const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
    chatList.appendChild(incomingMessageDiv);

    // Scroll to the bottom
    chatList.scrollTo(0,chatList.scrollHeight);

    generateAPIResponse(incomingMessageDiv);
}
 
//Copy message text to the clipboard
const copyMessage = (copyIcon) => {
    const messageText = copyIcon.parentElement.querySelector(".text").innerText;

    navigator.clipboard.writeText(messageText);
    copyIcon.innerText = "done";    //show tick icon
    setTimeout(() => { copyIcon.innerText = "content_copy", 1000 });         //Revert icon after 1 second
}

//Handle sending outgoing that messages 
const handleOutgoingChat = () =>{
    userMessage = typingForm.querySelector(".typing-input").value.trim()  ||  userMessage;  // ||usermessage is for suggestion questions
    if(!userMessage || isResponseGenerating) return;        //exit if no message and when response is generating

    isResponseGenerating = true;
    // console.log(userMessage);

    const html = `<div class="message-content">
                <img src="images/user.jpg" alt="user image" class="avatar">
                <p class="text"></p>
            </div>`;

    const outgoingMessageDiv = createMessageElement(html, "outgoing");

    //creating an element of the outgoing message and adding it to the chat list
    outgoingMessageDiv.querySelector(".text").innerHTML = userMessage;       
    chatList.appendChild(outgoingMessageDiv);

    typingForm.reset();     //clear input field

    chatList.scrollTo(0,chatList.scrollHeight);  // Scroll to the bottom

    document.body.classList.add("hide-header");  //Hide header once chat start

    setTimeout(showLoadingAnimation, 500);  //show loading animation a delay
}

//Toggle between light and dark mode
toggleThemeButton.addEventListener("click" , () =>{
    const isLightMode = document.body.classList.toggle("light_mode");
    //saving theme color to the local storage
    localStorage.setItem("themeColor",isLightMode ? "light_mode" : "dark_mode");
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
})

//page refresh kare ke baad bhi theme change na ho
const loadlocalstorageData = () =>{
    //for saving chats in local storage
    const savedChats = localStorage.getItem("savedchats");

    //getting the value of theme color from local storage
    const isLightMode = (localStorage.getItem("themeColor") === "light_mode");

    //apply the stored theme
    document.body.classList.toggle("light_mode",isLightMode);
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

    //Restore saved chats
    chatList.innerHTML = savedChats || "";

    // Scroll to the bottom
    chatList.scrollTo(0,chatList.scrollHeight);
    document.body.classList.toggle("hide-header",savedChats);   //Hide header once chat start
}

loadlocalstorageData();


//Delete all chats from local storage when button is clicked
deleteChatButton.addEventListener("click", () => {
    if(confirm("Are you sure you want to delete all the messages?")){
        localStorage.removeItem("savedChats");
        loadlocalstorageData();
    }
});


//Set userMessage and handle outgoing chat whrn a suggestion is clicked
suggestions.forEach(suggestion => {
    suggestion.addEventListener("click", () => {
        userMessage = suggestion.querySelector(".text").innerText;
        handleOutgoingChat();
    })
}) 


//preventing default form submitting and handle outgoing chat
typingForm.addEventListener("submit", (e) =>{
    e.preventDefault();         //preventing from default submitting

    handleOutgoingChat();
});

