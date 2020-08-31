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

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Print emails
      console.log(emails);

      emails.forEach(email => {
        var found = false;
        for(var i = 0; i < email.recipients.length; i++) {
            if (email.recipients[i] === document.querySelector('#sender').innerHTML) {
                found = true;
                break;
            }
        }
        if (mailbox === 'inbox' && found === true && email.archived === false) {
          const element = document.createElement('div');
          element.innerHTML = `Sender: ${email.sender} Subject: ${email.subject} Sent: ${email.timestamp}`;
          element.className = 'email';
          element.addEventListener('click', function() {
            load_email(email);
            return false;
          });
          if (email.read === true){
            element.style.backgroundColor = 'lightgrey';
          }
          document.querySelector('#emails-view').append(element);

        }

        if (mailbox === 'sent' && email.sender === document.querySelector('#sender').innerHTML && email.archived === false) {
          const element = document.createElement('div');
          element.innerHTML = `Recipients: ${email.recipients} Subject: ${email.subject} Sent: ${email.timestamp}`;
          element.className = 'email';
          element.addEventListener('click', function() {
            document.querySelector('#emails-view').innerHTML = '';
            load_email(email);
            return false;
          });
          if (email.read === true){
            element.style.backgroundColor = 'lightgrey';
          }
          document.querySelector('#emails-view').append(element);
        }

        if (mailbox === 'archive' && found === true && email.archived === true) {
          const element = document.createElement('div');
          element.innerHTML = `Sender: ${email.sender} Subject: ${email.subject} Sent: ${email.timestamp}`;
          element.className = 'email';
          element.addEventListener('click', function() {
            document.querySelector('#emails-view').innerHTML = '';
            load_email(email);
            return false;
          });
          if (email.read === true){
            element.style.backgroundColor = 'lightgrey';
          }
          document.querySelector('#emails-view').append(element);
        }
      });
  });

}

function send_email() {
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        "recipients": `${document.querySelector('#compose-recipients').value}`,
        "subject": `${document.querySelector('#compose-subject').value}`,
        "body": `${document.querySelector('#compose-body').value}`
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
      load_mailbox('sent');
  })
}

function load_email(email) {
  document.querySelector('#emails-view').innerHTML = '';
            fetch(`/emails/${email.id}`, {
            method: 'PUT',
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
            for(var i = 0; i < email.recipients.length; i++) {
                if (email.recipients[i] === document.querySelector('#sender').innerHTML) {
                    found = true;
                    break;
                }
        }
            if (found === true) {
              const archive = document.createElement('button');
              archive.className = 'btn btn-primary';
              if (email.archived === false){
                archive.innerHTML = 'Archive';
              }
              else {
                archive.innerHTML = 'Unarchive';
              }
              document.querySelector('#emails-view').append(archive);
              archive.addEventListener('click', () => {
                archivize(email);
              });

              const reply = document.createElement('button');
              reply.innerHTML = 'Reply';
              reply.className = 'btn btn-primary';
              reply.style.margin = '10px';
              document.querySelector('#emails-view').append(reply);
              reply.addEventListener('click', () => {
                compose_email();
                document.querySelector('#compose-recipients').value = `${email.sender}`;
                document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
              })
            }
}

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