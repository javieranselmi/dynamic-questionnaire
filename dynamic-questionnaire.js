'use strict';
(function () {
	angular.module('dynamic-questionnaire');
app.factory('dependency', [function() {
    var d = function Dependency(id, validation) {

        var self = this;
        this.id = id;
        this.validation = validation;

        //Methods
        this.validate = function(question) {
            return this.validation.validate(question);
        };

        this.updateFulfilled = function(question) {
            if (this.validate(question)) {
                this.fulfilled = true;
            } else {
                this.fullfilled = false;
            };
        }
    };
    return d;
}]);
app.factory('question', [function() {
    var qn = function Question(id, text, type, dependencies, showIndex, validation, selectValues) {
    
    var self = this;
    
    //Properties from constructor
    this.id = id;
    this.text = text;
    this.type = type;
    this.dependencies = dependencies;
    this.showIndex = showIndex;
    this.selectValues = selectValues || null;
    this.validation = validation;
    
    //Properties with defaults
    this.isDependencyReady = this.dependencies.length === 0 ? true : false;
    this.isAnswerValid = false;
    this.visibility = showIndex === 0? true : false;
    
    this.getDependenciesOfQuestion = function(question){
        var dependenciesOfQuestion = [];
        angular.forEach(this.dependencies, function(dep) {
                if (dep.id === question.id) {
                    dependenciesOfQuestion.push(dep);
                }
        });
        return dependenciesOfQuestion;
    }
    this.updateIsDependencyReady = function(questionList, modifiedQuestion) {
        this.updateDependencyFulfillment(questionList,modifiedQuestion);
        //If all dependencies fulfilled change isDependencyReady
        if(this.hasAllDependenciesFulfilled()) { 
                        this.isDependencyReady = true; //Se cumplio la dependencia y todas las demás.
        } else {
                        this.isDependencyReady = false; //Se cumplio la dependencia pero aún no esta ready.
        }
    }
    this.updateDependencyFulfillment = function(questionList, modifiedQuestion) {

        //Retrieve dependency to the updated question
        var dependencyList = this.getDependenciesOfQuestion(modifiedQuestion);
        
        //If the updated question not within dependencies, returns false.
        if (dependencyList.length === 0) {
            return false;
        } else { //If the updated question within dependencies, update the dependency fulfilled propery.
            angular.forEach(dependencyList, function(dependency) {
                dependency.updateFulfilled(modifiedQuestion)
            });
        }

    };
    this.hasAllDependenciesFulfilled = function() {
        return this.dependencies.every(function(dep){
                        return dep.fulfilled === true;
        })
    };
    this.validateAnswer = function() {
        //
    };
    this.dependsOn = function(question) {
        return this.dependencies.some(function(dep) {
                return dep.id === question.id;
        });
    }
    this.updateVisibility = function(modifiedQuestion) {
        if (this.hasAllDependenciesFulfilled() && modifiedQuestion.hasBeenAnswered()) {
            this.visibility = true;
        }
    }
    this.hasBeenAnswered = function() {
        return !(angular.isUndefined(this.answer) || this.answer === "");
    }
    this.submitAnswer = function(answer) {
        this.answer = answer;
    }
}
    return qn;
}]);
app.factory('section', [function() {
    var s = function Section(id, title, subtitle, questionList) {
        var self = this;
        this.id = id;
        this.title = title;
        this.subtitle = subtitle;
        this.questionList = questionList;

        this.updateQuestionsDependencies = function(modifiedQuestion){
            angular.forEach(this.getDependantQuestions(modifiedQuestion), function(question) {
                    question.updateIsDependencyReady(questionList, modifiedQuestion);
            });
        }
        this.updateQuestionsVisibility   = function(modifiedQuestion){
            var nextQuestions = this.getNextQuestions(modifiedQuestion);
            angular.forEach(nextQuestions, function(qn) {
                qn.updateVisibility(modifiedQuestion);
            })
        }
        this.update = function(modifiedQuestion){
            this.updateQuestionsDependencies(modifiedQuestion);
            this.updateQuestionsVisibility(modifiedQuestion);
        }
        this.getNextQuestions = function(question) {
            var nextQuestions = [];
            angular.forEach(this.questionList, function(qn) {
                    if (qn.showIndex - 1 === question.showIndex) {
                        nextQuestions.push(qn);
                    }
            });
            return nextQuestions;
        }
        this.getDependantQuestions = function(question) {
            var dependantQuestions = [];
            angular.forEach(this.questionList, function(qn) {
                    if (qn.dependsOn(question)) {
                        dependantQuestions.push(qn);
                    }
            });
            return dependantQuestions;
        } 
        this.submitAnswerAndUpdate = function(questionId, answer) {
            var qn = this.getQuestionById(questionId);
            if (angular.isDefined(qn)) {
                qn.submitAnswer(answer);
                this.update(qn);
                return true;
            } else {
                return false;
            }

        }
        this.getQuestionById = function(questionId) {
            return this.questionList.filter(function(qn) {
                return qn.id === questionId;
            })[0];
        }
    };
    return s;
}]);
app.factory('validation', [function() {
    var v = function Validation(obj) {
    this.regex = obj.regex;
    this.mustBeEqualTo = obj.mustBeEqualTo;
    this.mustBeGreaterThan = obj.mustBeGreaterThan;
    this.mustBeLessThan = obj.mustBeLessThan;
    this.mustBeLessOrEqualto = obj.mustBeLessOrEqualto;
    this.mustBeGreaterOrEqualTo = obj.mustBeGreaterOrEqualTo;
    this.maxLength = obj.maxLength;
    this.minLength = obj.minLength;
    this.required = obj.required;
    this.mustBeInSelectValues = obj.mustBeInSelectValues;
    this.mustBeInValues = obj.mustBeInValues;
    
    this.validateMustBeEqualTo = function(question) {
        if (angular.isDefined(this.mustBeEqualTo)) {
                if (question.answer === this.mustBeEqualTo) {
                    return true;
                } else {
                    return false;
                }
        } else {
            return true;
        }
    };
    this.validateMustBeGreaterThan = function(question) {
        if (angular.isDefined(this.mustBeGreaterThan)) {
                if (question.answer > this.mustBeGreaterThan) {
                    return true;
                } else {
                    return false;
                }
        } else {
            return true;
        }
    };
    this.validateMustBeLessThan = function(question) {
        if (angular.isDefined(this.mustBeLessThan)) {
                if (question.answer < this.MustBeLessThan) {
                    return true;
                } else {
                    return false;
                }
        } else {
            return true;
        }
    };
    this.validateMustBeLessOrEqualTo = function(question) {
        if (angular.isDefined(this.mustBeLessOrEqualTo)) {
                if (question.answer <= this.mustBeLessOrEqualTo) {
                    return true;
                } else {
                    return false;
                }
        } else {
            return true;
        }
    };
    this.validateMustBeGreaterOrEqualTo = function(question) {
        if (angular.isDefined(this.mustBeGreaterOrEqualTo)) {
                if (question.answer >= this.mustBeGreaterOrEqualTo) {
                    return true;
                } else {
                    return false;
                }
        } else {
            return true;
        }
    };
    this.validateMaxLength = function(question) {
        if (angular.isDefined(this.maxLength)) {
                if (question.answer.length <= this.maxLength) {
                    return true;
                } else {
                    return false;
                }
        } else {
            return true;
        }
    };
    this.validateMinLength = function(question) {
        if (angular.isDefined(this.minLength)) {
                if (question.answer.length >= this.minLength) {
                    return true;
                } else {
                    return false;
                }
        } else {
            return true;
        }
    };
    this.validateRequired = function(question) {
        if (angular.isDefined(this.required) || this.required === false) {
                if (angular.isDefined(question.answer) && question.answer !== "") {
                    return true;
                } else {
                    return false;
                }
        } else {
            return true;
        }
    };
    this.validateMustBeInSelectValues = function(question) {
        if (angular.isDefined(this.mustBeInSelectValues) || this.mustBeInSelectValues === false) {
                if (angular.isDefined(question.selectValues)) {
                    if ($.inArray(question.answer, question.selectValues) > -1) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
        } else {
            return true; //Retorna true si no está definido la propiedad
        }
    };
    this.validateMustBeInValues = function(question) {
        if (angular.isDefined(this.mustBeInValues)) {
                if ($.inArray(question.answer, question.mustBeInValues) > -1) {
                    return true;
                } else {
                    return false;
                }
        } else {
            return true;
        }
    };
    this.validate = function(question) {
        return (
            this.validateMustBeEqualTo(question) &&
            this.validateMustBeGreaterThan(question) &&
            this.validateMustBeLessThan(question) &&
            this.validateMustBeLessOrEqualTo(question) &&
            this.validateMustBeGreaterOrEqualTo(question) &&
            this.validateMaxLength(question) &&
            this.validateMinLength(question) &&
            this.validateRequired(question) &&
            this.validateMustBeInSelectValues(question) &&
            this.validateMustBeInValues(question)
            )
    };
};
    return v;
}]);
}());