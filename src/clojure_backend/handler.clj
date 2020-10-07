  
(ns clojure-backend.handler
  (:require [compojure.core :refer :all]
            [compojure.handler :as handler]
            [compojure.route :as route]
            [ring.middleware.reload :as reload]
            [ring.util.response :as response])
  (:use [ring.middleware.json :only [wrap-json-response wrap-json-body]]
        [ring.middleware.params :only [wrap-params]]
        [ring.middleware.resource :only [wrap-resource]]
        [ring.middleware.session :only [wrap-session]])
  (:gen-class))

(defroutes ring-app

  (GET "/" request
       {:status 200
        :body (slurp "resources/public/index.html")})

  (GET "/dummy.json" request
       {:status 200
        :body {:foo "bar" :timestamp (java.util.Date.)}})
        
  (route/not-found "<h1>Page not found</h1>"))

(def app (-> ring-app
             (wrap-resource "public") ;; serve from "resources/public"
             (wrap-resource "")
             (wrap-json-body {:keywords? true})
             wrap-json-response
             wrap-params
             handler/site))