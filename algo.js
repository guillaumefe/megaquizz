
var botui = new BotUI('my-botui-app');
target_url = ()=>{
    return document.getElementById('target_url').value || "it's empty"
}
var score = 0

var updateScore = function(val) {
    score_box = document.getElementById('score')
    score = score + val
    score_box.innerHTML = score
}

var recorded_answer = []
var record_answer = function (e) {
    if(e.target.checked) {
        recorded_answer.push(e.target.value)
    } else {
        var index = recorded_answer.indexOf(e.target.value)
        if (index > -1) {
            recorded_answer.splice(index, 1);
        }
    }
}

var questions = {
    "intro" : "Que souhaitez-vous apprendre aujourd'hui?",
}

var url = target_url();
fetch(url, { method:"GET"} )
    .then(function(response) {
        return response.text()
    })
    .then(function(text) {
        var data = text.split('\n')
        const regex_c = /^[cC]atégorie/g;
        const regex_q = /^[qQ]uestion/g;
        var current_category = "default"
        questions[current_category] = []
        var current_question = ""
        for (i in data) {
            if (data[i].match(regex_c)) {
                current_category = data[i]
                questions[current_category] = []
            }
            else if (data[i].match(regex_q)) {
                current_question = {
                    question: '<strong>'+data[i]+'</strong>',
                    reponse: ""
                }
                questions[current_category].push(current_question)
            } else {
                current_question.reponse += data[i]
            }
        }
        botui.message.add({ // show a message
            //human: true,
            content: questions['intro'] 
        }).then(function () { // wait till its shown
            var topics = []
            for (let i in questions) {
                if (i !== "intro") {
                    topics.push({
                        text: i,
                        value: i
                    })
                }
            }
            start(topics)
        });
    })
    .catch( (e) => {
    })

function start(topics) {

    var them = ""
    var bag = []
    var bag_factor = function(key) {
        bag = []
        for (let i in questions[key]) {
            try {
                bag.push(questions[key][i].reponse)
            } catch(e) {}
        }
        return bag
    }
    var ask = (them, num)=>questions[them][num].question
    var answer = (them, num)=>questions[them][num].reponse.split('\n')

    botui.action.button({
        action: topics
    }).then(function (res) { // will be called when a button is clicked.
        //.then(function (res) { // get the result
        theme = res.value
        botui.message.add({
            content: "ok je cherche"
        });
        var brain = function() {
            var question_bag = bag_factor(theme)
            var rand = Math.floor(Math.random() * questions[theme].length -1) + 1  
            var q = ask(res.value, rand)
            var r = answer(res.value, rand)
            var trashed = []
            botui.message.add({
                type: 'html',
                delay: 1500,
                content: q
            }).then(()=>{
                var t1 = Math.floor(Math.random() * question_bag.length - 1) + 1
                var t2 = Math.floor(Math.random() * question_bag.length - 1) + 1
                var sec = 100
                while (question_bag[t1] === r && sec > 0) {
                    t1 = Math.floor(Math.random() * question_bag.length - 1) + 1
                    sec = sec - 1
                }
                while (question_bag[t2] === r && sec > 0) {
                    t2 = Math.floor(Math.random() * question_bag.length - 1) + 1
                    sec = sec - 1
                }
                if (t1 !== r && t1 !== t2) {
                    trashed.push({
                        text: '<input onclick="record_answer(event)" value="'+question_bag[t1]+'" type="checkbox">' + question_bag[t1] + '</input>',
                        value: question_bag[t1],
                    })
                }
                if (t2 !== r) {
                    trashed.push({
                        text: '<input onclick="record_answer(event)" value="'+question_bag[t2]+'" type="checkbox">' + question_bag[t2] + '</input>',
                        value: question_bag[t2],
                    })
                }
                var index = Math.floor(Math.random() * 3) + 1
                trashed.splice(index - 1, 0, {
                    text: '<input onclick="record_answer(event)" value="'+r+'" type="checkbox"></input> ' + r + '</input>',
                    value: '<input type="checkbox"></input> ' + r
                });

                for (let t in trashed) {
                    botui.message.add({
                        type: 'html',
                        content: trashed[t].text
                    }).then(()=>{
                    });
                }

                var cpt = 0
                botui.action.button({
                    action: [{text:"submit", value:"submit"}]
                }).then(function (res) { // will be called when a button is clicked.
                    var isEqual = function (a, b) {
                        if(a.length!=b.length) {
                            return false;
                        } else {
                            for(var i=0;i<a.length;i++) {
                                if(a[i]!=b[i]) {
                                    return false;
                                }
                                return true;
                            }
                        }
                    }

                    console.log(recorded_answer.sort(), r.sort())
                    if (isEqual(recorded_answer.sort(), r.sort())) {
                        botui.message.add({
                            content: 'well done!'
                        }).then(()=>{
                            recorded_answer = []
                            updateScore(1)
                            brain()
                        });
                    } else {
                        botui.message.add({
                            content: 'nope.'
                        }).then(()=>{
                            recorded_answer = []
                            updateScore(-1)
                            brain()
                        });
                    }

                });
            })
        }

        brain()
    })

}
