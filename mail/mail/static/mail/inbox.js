document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  // When send button is clicked
  document.querySelector('#compose-form').addEventListener('submit', () => {
    send_email();
    return false;
  });
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  // Make API request to proper mailbox route
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Print emails
      console.log(emails);
      
      // Iterate through emails database
      emails.forEach(email => {
        var found = false;
        
        // Check if logged in user is among the e-mail's recipient
        for(var i = 0; i < email.recipients.length; i++) {
            if (email.recipients[i] === document.querySelector('#sender').innerHTML) {
                found = true;
                break;
            }
        }
        
        // If user is in inbox, create div for each received e-mail and append it to the view
        if (mailbox === 'inbox' && found === true && email.archived === false) {
          const element = document.createElement('div');
          element.innerHTML = `Sender: ${email.sender} Subject: ${email.subject} Sent: ${email.timestamp}`;
          element.className = 'email';
          element.addEventListener('click', function() {
            // After e-mail is clicked run load e-mail function
            load_email(email);
            return false;
          });
          
          // If e-mail is read, set background to light grey
          if (email.read === true){
            element.style.backgroundColor = 'lightgrey';
          }
          document.querySelector('#emails-view').append(element);

        }
        // If user is in sent, create div for each sent e-mail and append it to the view
        if (mailbox === 'sent' && email.sender === document.querySelector('#sender').innerHTML && email.archived === false) {
          const element = document.createElement('div');
          element.innerHTML = `Recipients: ${email.recipients} Subject: ${email.subject} Sent: ${email.timestamp}`;
          element.className = 'email';
          element.addEventListener('click', function() {
            // After e-mail is clicked, run load e-mail function
            load_email(email);
            return false;
          });
          if (email.read === true){
            
            // If e-mail is read, set background to light grey
            element.style.backgroundColor = 'lightgrey';
          }
          document.querySelector('#emails-view').append(element);
        }
        
        // If user is in archive, create div for each e-mail that was archivised and append it to the view
        if (mailbox === 'archive' && found === true && email.archived === true) {
          const element = document.createElement('div');
          element.innerHTML = `Sender: ${email.sender} Subject: ${email.subject} Sent: ${email.timestamp}`;
          element.className = 'email';
          element.addEventListener('click', function() {
            // After e-mail is clicked, run load e-mail function
            load_email(email);
            return false;
          });
          if (email.read === true){
            
            // If e-mail is read, set background to light grey
            element.style.backgroundColor = 'lightgrey';
          }
          document.querySelector('#emails-view').append(element);
        }
      });
  });

}

// Function for sending e-mails
function send_email() {
  
  // Post data to proper API route
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        "recipients": `${document.querySelector('#compose-recipients').value}`,
        "subject": `${document.querySelector('#compose-subject').value}`,
        "body": `${document.querySelector('#compose-body').value}`
    })
  })
  
  // Wait for results, then load sent mailbox
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
      load_mailbox('sent');
  })
}

// Function for loading separate e-mails view
function load_email(email) {
  
  // Clear the view
  document.querySelector('#emails-view').innerHTML = '';
  
  // Make PUT request to API route for separate emails
  fetch(`/emails/${email.id}`, {
    method: 'PUT',
    // Set read to true
    body: JSON.stringify({
      read: true
    })
  })

  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  const fullemail = document.createElement('div');
  fullemail.innerHTML = `<h1>Sender: ${email.sender}</h1><h2>Subject: ${email.subject}</h2><h3>Sent: ${email.timestamp}</h3><p>${email["body"]}</p>`;
  document.querySelector('#emails-view').append(fullemail);
            
  var found = false;
  // Check if the logged in user is the e-mails recipient
  for(var i = 0; i < email.recipients.length; i++) {
    if (email.recipients[i] === document.querySelector('#sender').innerHTML) {
      found = true;
      break;
    }
  }
  
  // If user is among recipients
  if (found === true) {
    
    // Create archive/unarchive button
    const archive = document.createElement('button');
    archive.className = 'btn btn-primary';
    
    // If email is not in archive, set inner HTML of the button to Archive, else set it to Unarchive
    if (email.archived === false){
      archive.innerHTML = 'Archive';
    } else {
      archive.innerHTML = 'Unarchive';
    }          
    document.querySelector('#emails-view').append(archive);
    
    // When button is clicked, run archivize function
    archive.addEventListener('click', () => {
      archivize(email);
    });
    
    // Create reply button
    const reply = document.createElement('button');
    reply.innerHTML = 'Reply';
    reply.className = 'btn btn-primary';
    reply.style.margin = '10px';
    document.querySelector('#emails-view').append(reply);
    
    // When clicked, load view for composing e-mails, pre-filling the recipients and subject values
    reply.addEventListener('click', () => {
      compose_email();
      document.querySelector('#compose-recipients').value = `${email.sender}`;
      document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
    })
  }
}

// Function for archivizing and unarchivizing e-mails
function archivize(email){
  if (email.archived === false){
    fetch(`/emails/${email.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        archived: true
        })
      })
      .then(result => {
        load_mailbox('inbox');
      });
  }
  else {
    fetch(`/emails/${email.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        archived: false
        })
      })
      .then(result => {
        load_mailbox('inbox');
      });
  }
}
