import {Injectable} from '@angular/core';
import { Subject } from 'rxjs'
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';

import { environment } from '../../environments/environment'
import { Post } from './post.model';

const BACKEND_URL = environment.apiUrl + '/posts/';

@Injectable({providedIn:'root'})
export class PostService{
    private posts: Post[] = [];
    private postsUpdated = new Subject<{posts: Post[], postCount: number}>();

    constructor(private http: HttpClient, private router: Router){}

    getPosts(postsPerPage: number, currentPage: number){
        const queryParams = `?pageSize=${postsPerPage}&page=${currentPage}`
        // return [...this.posts];
        //the unsubscription from this will be added by Angular, 
        // so I don't need do unsubscribe by my self.
        this.http
        .get<{message: string, posts: any, maxPosts: number}>(BACKEND_URL + queryParams)
        .pipe(map((postData)=>{
            return {
                posts: postData.posts.map(post=>{
                return {
                    title: post.title,
                    content: post.content,
                    id: post._id,
                    filePath: post.filePath,
                    creator: post.creator
                }
            
            }),
            maxPosts: postData.maxPosts
        }
        }))
        .subscribe((transformedPostData)=>{
            this.posts=transformedPostData.posts;
            this.postsUpdated.next({posts: [...this.posts], postCount: transformedPostData.maxPosts});
        });
    }

    getPost(id: string){
        return this.http.get<{_id: string, title: string, content: string, filePath: string, creator: string}>(BACKEND_URL + id);
    }


    getPostUpdateListener(){
        return this.postsUpdated.asObservable();
    }

    addPost(title: string, content: string, file: File){
        const postData = new FormData();
        postData.append("title", title);
        postData.append("content", content);
        postData.append("file", file, title);
        this.http.post<{message: string, post: Post}>(BACKEND_URL, postData)
        .subscribe((responseData)=>{
            //i dont need this anymore, becouse i navigate to 
            //first page where it will fetch the latest version anyways 
            // const post = {
            //     id: responseData.post.id, 
            //     title: title, 
            //     content: content,
            //     filePath: responseData.post.filePath
            // }
            // this.posts.push(post);
            //     //this pushes copy of my posts after update
            //     //this will be emmited after I add u post
            // this.postsUpdated.next([...this.posts]);
            this.router.navigate(['/']);

        });

        
    }

    updatePost(id: string, title: string, content: string, file: File|string) {
        let postData: Post | FormData;
        if(typeof(file) === 'object'){
            const postData = new FormData();
            postData.append('id', id);
            postData.append('title', title);
            postData.append('content', content);
            postData.append('file', file, title);
        } else {
            const postData: Post = {
                id: id,
                title: title,
                content: content,
                filePath: file,
                creator: null
            }
        }
        this.http.put(BACKEND_URL + id, postData).subscribe(res =>
            {//i dont need this anymore, becouse i navigate to 
            //first page where it will fetch the latest version anyways 
                // const updatedPost = [...this.posts];
                // const oldPostIndex = updatedPost.findIndex(p => p.id === id);
                // const post: Post = {
                //     id: id,
                //     title: title,
                //     content: content,
                //     filePath: ""
                // }
                // updatedPost[oldPostIndex] = post;
                // this.posts = updatedPost;
                // this.posts = updatedPost;
                // this.postsUpdated.next([...this.posts]);
                this.router.navigate(['/']);

            }
        );
    }

    deletePost(postId: string){  
        return this.http.delete(BACKEND_URL + postId);
      
    }

    //TODO
    downloadFile(filePath: string): void {
        // this.http.get(filePath, { responseType: 'blob'}).subscribe(res => {
        //   window.open(window.URL.createObjectURL(res));
        // });
    }

}